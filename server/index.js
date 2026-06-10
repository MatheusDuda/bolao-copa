import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../data/db.json');

function readDB() {
  return JSON.parse(readFileSync(DB_PATH, 'utf8'));
}

function writeDB(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function winner(score_a, score_b) {
  if (score_a > score_b) return 'a';
  if (score_b > score_a) return 'b';
  return 'draw';
}

function recalculateAllScores(db) {
  for (const user of db.users) {
    let matchPts = 0;
    for (const pred of db.predictions.filter(p => p.user_id === user.id)) {
      const match = db.matches.find(m => m.id === pred.match_id);
      if (!match || match.status !== 'finished') { pred.points = 0; continue; }
      if (pred.score_a === match.score_a && pred.score_b === match.score_b) {
        pred.points = 3;
      } else if (winner(pred.score_a, pred.score_b) === winner(match.score_a, match.score_b)) {
        pred.points = 1;
      } else {
        pred.points = 0;
      }
      matchPts += pred.points;
    }
    const pick = db.pre_tournament_picks.find(p => p.user_id === user.id);
    const extraPts = { champion: 0, top_scorer: 0, best_attack: 0, best_defense: 0, neymar: 0, brazil: 0 };
    if (pick) {
      const er = db.extra_results;
      if (er.champion && pick.champion === er.champion) extraPts.champion = 10;
      if (er.top_scorer && pick.top_scorer === er.top_scorer) extraPts.top_scorer = 8;
      if (er.best_attack && pick.best_attack === er.best_attack) extraPts.best_attack = 5;
      if (er.best_defense && pick.best_defense === er.best_defense) extraPts.best_defense = 5;
      if (er.neymar_scored !== null && pick.neymar_scores === er.neymar_scored) extraPts.neymar = 3;
      if (er.brazil_performance && pick.brazil_performance === er.brazil_performance) extraPts.brazil = 17;
      pick.points = Object.values(extraPts).reduce((a, b) => a + b, 0);
    }
    user.score_breakdown = { match_points: matchPts, ...extraPts };
    user.score = matchPts + (pick?.points ?? 0);
  }
}

function isMatchLocked(match, hoursBeforeLock) {
  return new Date(match.datetime) - Date.now() < hoursBeforeLock * 3_600_000;
}

function isTournamentStarted(copaStartDate) {
  return Date.now() >= new Date(copaStartDate).getTime();
}

const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware — injects req.user from X-User-Id header
app.use((req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return next();
  const db = readDB();
  req.user = db.users.find(u => u.id === userId) || null;
  // Admin acting on behalf of another user
  const adminId = req.headers['x-admin-id'];
  if (adminId) {
    req.adminUser = db.users.find(u => u.id === adminId) || null;
  }
  next();
});

function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  next();
}

function requireAdmin(req, res, next) {
  const actor = req.adminUser || req.user;
  if (!actor || actor.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
  next();
}

// POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  res.json({ id: user.id, username: user.username, display_name: user.display_name, role: user.role });
});

// Users
app.get('/api/users', requireUser, requireAdmin, (req, res) => {
  const db = readDB();
  res.json(db.users.map(({ password, ...u }) => u));
});

app.post('/api/users', requireUser, requireAdmin, (req, res) => {
  const { username, password, display_name, role } = req.body;
  const db = readDB();
  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username já existe' });
  }
  const user = {
    id: uuidv4(), username, password, display_name: display_name || username,
    role: role || 'user', score: 0,
    score_breakdown: { match_points: 0, champion: 0, top_scorer: 0, best_attack: 0, best_defense: 0, neymar: 0, brazil: 0 }
  };
  db.users.push(user);
  writeDB(db);
  const { password: _, ...safe } = user;
  res.status(201).json(safe);
});

app.put('/api/users/:id', requireUser, requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Usuário não encontrado' });
  const { password, display_name, role, username } = req.body;
  if (username) db.users[idx].username = username;
  if (display_name) db.users[idx].display_name = display_name;
  if (password) db.users[idx].password = password;
  if (role) db.users[idx].role = role;
  writeDB(db);
  const { password: _, ...safe } = db.users[idx];
  res.json(safe);
});

app.delete('/api/users/:id', requireUser, requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Usuário não encontrado' });
  db.users.splice(idx, 1);
  writeDB(db);
  res.json({ ok: true });
});

// Matches
app.get('/api/matches', requireUser, (req, res) => {
  const db = readDB();
  res.json(db.matches);
});

app.post('/api/matches', requireUser, requireAdmin, (req, res) => {
  const db = readDB();
  const match = {
    id: uuidv4(),
    phase: req.body.phase || 'Fase de Grupos',
    team_a: req.body.team_a,
    team_b: req.body.team_b,
    datetime: req.body.datetime,
    score_a: req.body.score_a ?? null,
    score_b: req.body.score_b ?? null,
    status: req.body.status || 'scheduled',
    football_data_id: req.body.football_data_id || null
  };
  db.matches.push(match);
  if (match.status === 'finished') recalculateAllScores(db);
  writeDB(db);
  res.status(201).json(match);
});

app.put('/api/matches/:id', requireUser, requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.matches.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Jogo não encontrado' });
  Object.assign(db.matches[idx], req.body);
  recalculateAllScores(db);
  writeDB(db);
  res.json(db.matches[idx]);
});

app.delete('/api/matches/:id', requireUser, requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.matches.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Jogo não encontrado' });
  db.matches.splice(idx, 1);
  writeDB(db);
  res.json({ ok: true });
});

// Predictions
app.get('/api/predictions', requireUser, (req, res) => {
  const db = readDB();
  const userId = req.query.userId || req.user.id;
  res.json(db.predictions.filter(p => p.user_id === userId));
});

app.post('/api/predictions', requireUser, (req, res) => {
  const db = readDB();
  const effectiveUserId = req.body.user_id || req.user.id;
  const { match_id, score_a, score_b } = req.body;
  const match = db.matches.find(m => m.id === match_id);
  if (!match) return res.status(404).json({ error: 'Jogo não encontrado' });
  if (isMatchLocked(match, db.settings.hours_before_lock)) {
    return res.status(400).json({ error: 'Prazo de palpite encerrado' });
  }
  const existing = db.predictions.find(p => p.user_id === effectiveUserId && p.match_id === match_id);
  if (existing) {
    existing.score_a = score_a;
    existing.score_b = score_b;
    recalculateAllScores(db);
    writeDB(db);
    return res.json(existing);
  }
  const pred = { id: uuidv4(), user_id: effectiveUserId, match_id, score_a, score_b, points: 0 };
  db.predictions.push(pred);
  recalculateAllScores(db);
  writeDB(db);
  res.status(201).json(pred);
});

app.put('/api/predictions/:id', requireUser, (req, res) => {
  const db = readDB();
  const pred = db.predictions.find(p => p.id === req.params.id);
  if (!pred) return res.status(404).json({ error: 'Palpite não encontrado' });
  const match = db.matches.find(m => m.id === pred.match_id);
  if (!match) return res.status(404).json({ error: 'Jogo não encontrado' });
  if (isMatchLocked(match, db.settings.hours_before_lock)) {
    return res.status(400).json({ error: 'Prazo de palpite encerrado' });
  }
  pred.score_a = req.body.score_a;
  pred.score_b = req.body.score_b;
  recalculateAllScores(db);
  writeDB(db);
  res.json(pred);
});

// Pre-tournament picks
app.get('/api/pre-tournament', requireUser, (req, res) => {
  const db = readDB();
  const userId = req.query.userId || req.user.id;
  res.json(db.pre_tournament_picks.find(p => p.user_id === userId) || null);
});

app.post('/api/pre-tournament', requireUser, (req, res) => {
  const db = readDB();
  const actor = req.adminUser || req.user;
  if (isTournamentStarted(db.settings.copa_start_date) && actor.role !== 'admin') {
    return res.status(400).json({ error: 'Torneio já começou, palpites pré-torneio bloqueados' });
  }
  const effectiveUserId = req.body.user_id || req.user.id;
  const existing = db.pre_tournament_picks.find(p => p.user_id === effectiveUserId);
  if (existing) {
    Object.assign(existing, req.body, { user_id: effectiveUserId });
    recalculateAllScores(db);
    writeDB(db);
    return res.json(existing);
  }
  const pick = { id: uuidv4(), user_id: effectiveUserId, points: 0, ...req.body };
  db.pre_tournament_picks.push(pick);
  recalculateAllScores(db);
  writeDB(db);
  res.status(201).json(pick);
});

app.put('/api/pre-tournament/:id', requireUser, (req, res) => {
  const db = readDB();
  const actor = req.adminUser || req.user;
  if (isTournamentStarted(db.settings.copa_start_date) && actor.role !== 'admin') {
    return res.status(400).json({ error: 'Torneio já começou, palpites pré-torneio bloqueados' });
  }
  const idx = db.pre_tournament_picks.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Pick não encontrado' });
  Object.assign(db.pre_tournament_picks[idx], req.body);
  recalculateAllScores(db);
  writeDB(db);
  res.json(db.pre_tournament_picks[idx]);
});

// Extra results
app.get('/api/extra-results', requireUser, (req, res) => {
  const db = readDB();
  res.json(db.extra_results);
});

app.put('/api/extra-results', requireUser, requireAdmin, (req, res) => {
  const db = readDB();
  Object.assign(db.extra_results, req.body);
  recalculateAllScores(db);
  writeDB(db);
  res.json(db.extra_results);
});

// Settings
app.get('/api/settings', requireUser, requireAdmin, (req, res) => {
  const db = readDB();
  res.json(db.settings);
});

app.put('/api/settings', requireUser, requireAdmin, (req, res) => {
  const db = readDB();
  Object.assign(db.settings, req.body);
  writeDB(db);
  res.json(db.settings);
});

// Standings
app.get('/api/standings', requireUser, (req, res) => {
  const db = readDB();
  const standings = db.users
    .map(u => ({
      id: u.id,
      display_name: u.display_name,
      username: u.username,
      score: u.score,
      score_breakdown: u.score_breakdown
    }))
    .sort((a, b) => b.score - a.score)
    .map((u, i) => ({ ...u, position: i + 1 }));
  res.json(standings);
});

// Sync football-data.org
app.post('/api/sync', requireUser, requireAdmin, async (req, res) => {
  const db = readDB();
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'API key não configurada' });

  const headers = { 'X-Auth-Token': apiKey };
  const base = 'https://api.football-data.org/v4';

  try {
    const [matchesRes, scorersRes, standingsRes] = await Promise.all([
      fetch(`${base}/competitions/WC/matches?season=2026`, { headers }),
      fetch(`${base}/competitions/WC/scorers?season=2026&limit=1`, { headers }),
      fetch(`${base}/competitions/WC/standings?season=2026`, { headers })
    ]);

    const [matchesData, scorersData, standingsData] = await Promise.all([
      matchesRes.json(),
      scorersRes.json(),
      standingsRes.json()
    ]);

    let synced = 0;
    let created = 0;

    // Update/create matches
    if (matchesData.matches) {
      for (const m of matchesData.matches) {
        const homeTeam = m.homeTeam?.name || m.homeTeam?.shortName || '';
        const awayTeam = m.awayTeam?.name || m.awayTeam?.shortName || '';
        const datetime = m.utcDate;
        const fdId = String(m.id);

        let existing = db.matches.find(dm => dm.football_data_id === fdId);
        if (!existing) {
          existing = db.matches.find(dm =>
            dm.team_a === homeTeam && dm.team_b === awayTeam
          );
        }

        const phaseMap = {
          'GROUP_STAGE': 'Fase de Grupos',
          'LAST_16': 'Oitavas',
          'QUARTER_FINALS': 'Quartas',
          'SEMI_FINALS': 'Semifinal',
          'FINAL': 'Final',
          'THIRD_PLACE': 'Terceiro Lugar'
        };
        const phase = phaseMap[m.stage] || m.stage || 'Fase de Grupos';

        const statusMap = { 'SCHEDULED': 'scheduled', 'TIMED': 'scheduled', 'IN_PLAY': 'live', 'PAUSED': 'live', 'FINISHED': 'finished' };
        const status = statusMap[m.status] || 'scheduled';

        const score_a = m.score?.fullTime?.home ?? null;
        const score_b = m.score?.fullTime?.away ?? null;

        if (existing) {
          existing.football_data_id = fdId;
          existing.status = status;
          if (status === 'finished') {
            existing.score_a = score_a;
            existing.score_b = score_b;
          }
          existing.datetime = datetime;
          synced++;
        } else {
          db.matches.push({
            id: uuidv4(),
            football_data_id: fdId,
            phase,
            team_a: homeTeam,
            team_b: awayTeam,
            datetime,
            score_a: status === 'finished' ? score_a : null,
            score_b: status === 'finished' ? score_b : null,
            status
          });
          created++;
        }
      }
    }

    // Top scorer
    if (scorersData.scorers?.length > 0) {
      const top = scorersData.scorers[0];
      db.extra_results.top_scorer = top.player?.name || null;
    }

    // Best attack / best defense from group standings
    if (standingsData.standings) {
      const groupStandings = standingsData.standings.filter(s => s.stage === 'GROUP_STAGE');
      let bestAttackTeam = null, bestAttackGoals = -1;
      let bestDefenseTeam = null, bestDefenseGoals = Infinity;

      for (const group of groupStandings) {
        for (const row of group.table || []) {
          if (row.goalsFor > bestAttackGoals) {
            bestAttackGoals = row.goalsFor;
            bestAttackTeam = row.team?.name || null;
          }
          if (row.goalsAgainst < bestDefenseGoals) {
            bestDefenseGoals = row.goalsAgainst;
            bestDefenseTeam = row.team?.name || null;
          }
        }
      }
      if (bestAttackTeam) db.extra_results.best_attack = bestAttackTeam;
      if (bestDefenseTeam) db.extra_results.best_defense = bestDefenseTeam;
    }

    recalculateAllScores(db);
    writeDB(db);
    res.json({ ok: true, synced, created, message: `${synced} jogos atualizados, ${created} criados` });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Erro ao sincronizar: ' + err.message });
  }
});

app.listen(3001, () => console.log('Betolão server running on http://localhost:3001'));
