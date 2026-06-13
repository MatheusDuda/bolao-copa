import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function winner(score_a, score_b) {
  if (score_a > score_b) return 'a';
  if (score_b > score_a) return 'b';
  return 'draw';
}

async function recalculateAllScores() {
  const [
    { data: users },
    { data: predictions },
    { data: matches },
    { data: picks },
    { data: extraRow }
  ] = await Promise.all([
    supabase.from('users').select('id'),
    supabase.from('predictions').select('*'),
    supabase.from('matches').select('id,score_a,score_b,status'),
    supabase.from('pre_tournament_picks').select('*'),
    supabase.from('extra_results').select('*').eq('id', 1).single()
  ]);

  const er = extraRow || {};
  const dbUpdates = [];

  for (const user of (users || [])) {
    let matchPts = 0;
    const userPreds = (predictions || []).filter(p => p.user_id === user.id);

    let gamesPlayed = 0;
    for (const pred of userPreds) {
      const match = (matches || []).find(m => m.id === pred.match_id);
      let pts = 0;
      if (match && match.status === 'finished') {
        gamesPlayed++;
        const exactScore = pred.score_a === match.score_a && pred.score_b === match.score_b;
        const matchResult = winner(match.score_a, match.score_b);
        const predResult = winner(pred.score_a, pred.score_b);
        if (exactScore) {
          pts = matchResult === 'draw' ? 4 : 3;
        } else if (predResult === matchResult) {
          pts = 1;
        }
      }
      matchPts += pts;
      if (pred.points !== pts) {
        dbUpdates.push(supabase.from('predictions').update({ points: pts }).eq('id', pred.id));
      }
    }

    const pick = (picks || []).find(p => p.user_id === user.id);
    const extraPts = { champion: 0, top_scorer: 0, best_attack: 0, best_defense: 0, neymar: 0, brazil: 0 };
    let pickPoints = 0;

    if (pick) {
      if (er.champion && pick.champion === er.champion) extraPts.champion = 10;
      if (er.top_scorer && pick.top_scorer === er.top_scorer) extraPts.top_scorer = 8;
      if (er.best_attack && pick.best_attack === er.best_attack) extraPts.best_attack = 5;
      if (er.best_defense && pick.best_defense === er.best_defense) extraPts.best_defense = 5;
      if (er.neymar_scored !== null && er.neymar_scored !== undefined && pick.neymar_scores === er.neymar_scored) extraPts.neymar = 3;
      if (er.brazil_performance && pick.brazil_performance === er.brazil_performance) extraPts.brazil = 17;
      pickPoints = Object.values(extraPts).reduce((a, b) => a + b, 0);
      dbUpdates.push(supabase.from('pre_tournament_picks').update({ points: pickPoints }).eq('id', pick.id));
    }

    const score_breakdown = { match_points: matchPts, games_played: gamesPlayed, ...extraPts };
    const score = matchPts + pickPoints;
    dbUpdates.push(supabase.from('users').update({ score, score_breakdown }).eq('id', user.id));
  }

  await Promise.all(dbUpdates);
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

const distPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

app.use(async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return next();
  const { data: users } = await supabase.from('users').select('*').eq('id', userId).limit(1);
  req.user = users?.[0] || null;
  const adminId = req.headers['x-admin-id'];
  if (adminId) {
    const { data: adminUsers } = await supabase.from('users').select('*').eq('id', adminId).limit(1);
    req.adminUser = adminUsers?.[0] || null;
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
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const { data: users } = await supabase.from('users').select('*').eq('username', username).limit(1);
  const user = users?.[0];
  if (!user || user.password !== password) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  res.json({ id: user.id, username: user.username, display_name: user.display_name, role: user.role });
});

// Users
app.get('/api/users', requireUser, requireAdmin, async (req, res) => {
  const { data: users } = await supabase.from('users').select('id,username,display_name,role,score,score_breakdown');
  res.json(users);
});

app.post('/api/users', requireUser, requireAdmin, async (req, res) => {
  const { username, password, display_name, role } = req.body;
  const { data: existing } = await supabase.from('users').select('id').eq('username', username).limit(1);
  if (existing?.length) return res.status(400).json({ error: 'Username já existe' });
  const user = {
    id: uuidv4(), username, password, display_name: display_name || username,
    role: role || 'user', score: 0,
    score_breakdown: { match_points: 0, champion: 0, top_scorer: 0, best_attack: 0, best_defense: 0, neymar: 0, brazil: 0 }
  };
  await supabase.from('users').insert(user);
  const { password: _, ...safe } = user;
  res.status(201).json(safe);
});

app.put('/api/users/:id', requireUser, requireAdmin, async (req, res) => {
  const { data: existing } = await supabase.from('users').select('id').eq('id', req.params.id).limit(1);
  if (!existing?.length) return res.status(404).json({ error: 'Usuário não encontrado' });
  const { password, display_name, role, username } = req.body;
  const updates = {};
  if (username) updates.username = username;
  if (display_name) updates.display_name = display_name;
  if (password) updates.password = password;
  if (role) updates.role = role;
  const { data: updated } = await supabase.from('users').update(updates).eq('id', req.params.id).select().single();
  const { password: _, ...safe } = updated;
  res.json(safe);
});

app.delete('/api/users/:id', requireUser, requireAdmin, async (req, res) => {
  const { data: existing } = await supabase.from('users').select('id').eq('id', req.params.id).limit(1);
  if (!existing?.length) return res.status(404).json({ error: 'Usuário não encontrado' });
  await supabase.from('users').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

// Matches
app.get('/api/matches', async (req, res) => {
  const [{ data: matches }, { data: settings }] = await Promise.all([
    supabase.from('matches').select('*'),
    supabase.from('settings').select('hours_before_lock').eq('id', 1).single()
  ]);
  const lockHours = settings?.hours_before_lock ?? 0;
  res.json((matches || []).map(m => ({ ...m, lock_hours: lockHours })));
});

app.post('/api/matches', requireUser, requireAdmin, async (req, res) => {
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
  await supabase.from('matches').insert(match);
  if (match.status === 'finished') await recalculateAllScores();
  res.status(201).json(match);
});

app.put('/api/matches/:id', requireUser, requireAdmin, async (req, res) => {
  const { data: existing } = await supabase.from('matches').select('id').eq('id', req.params.id).limit(1);
  if (!existing?.length) return res.status(404).json({ error: 'Jogo não encontrado' });
  const { data: updated } = await supabase.from('matches').update(req.body).eq('id', req.params.id).select().single();
  await recalculateAllScores();
  res.json(updated);
});

app.delete('/api/matches/:id', requireUser, requireAdmin, async (req, res) => {
  const { data: existing } = await supabase.from('matches').select('id').eq('id', req.params.id).limit(1);
  if (!existing?.length) return res.status(404).json({ error: 'Jogo não encontrado' });
  await supabase.from('matches').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

// Predictions
app.get('/api/predictions', requireUser, async (req, res) => {
  const userId = req.query.userId || req.user.id;
  const { data: predictions } = await supabase.from('predictions').select('*').eq('user_id', userId);
  res.json(predictions);
});

app.post('/api/predictions', requireUser, async (req, res) => {
  const effectiveUserId = req.body.user_id || req.user.id;
  const { match_id, score_a, score_b } = req.body;

  const [{ data: matchRows }, { data: settingsRow }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', match_id).limit(1),
    supabase.from('settings').select('hours_before_lock').eq('id', 1).single()
  ]);

  const match = matchRows?.[0];
  if (!match) return res.status(404).json({ error: 'Jogo não encontrado' });
  if (isMatchLocked(match, settingsRow.hours_before_lock)) {
    return res.status(400).json({ error: 'Prazo de palpite encerrado' });
  }

  const { data: existingRows } = await supabase.from('predictions').select('*').eq('user_id', effectiveUserId).eq('match_id', match_id).limit(1);

  if (existingRows?.length) {
    const { data: updated } = await supabase.from('predictions').update({ score_a, score_b }).eq('id', existingRows[0].id).select().single();
    await recalculateAllScores();
    return res.json(updated);
  }

  const pred = { id: uuidv4(), user_id: effectiveUserId, match_id, score_a, score_b, points: 0 };
  await supabase.from('predictions').insert(pred);
  await recalculateAllScores();
  res.status(201).json(pred);
});

app.put('/api/predictions/:id', requireUser, async (req, res) => {
  const { data: predRows } = await supabase.from('predictions').select('*').eq('id', req.params.id).limit(1);
  if (!predRows?.length) return res.status(404).json({ error: 'Palpite não encontrado' });
  const pred = predRows[0];

  const [{ data: matchRows }, { data: settingsRow }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', pred.match_id).limit(1),
    supabase.from('settings').select('hours_before_lock').eq('id', 1).single()
  ]);

  const match = matchRows?.[0];
  if (!match) return res.status(404).json({ error: 'Jogo não encontrado' });
  if (isMatchLocked(match, settingsRow.hours_before_lock)) {
    return res.status(400).json({ error: 'Prazo de palpite encerrado' });
  }

  const { data: updated } = await supabase.from('predictions').update({ score_a: req.body.score_a, score_b: req.body.score_b }).eq('id', req.params.id).select().single();
  await recalculateAllScores();
  res.json(updated);
});

// Pre-tournament picks
app.get('/api/pre-tournament', requireUser, async (req, res) => {
  const userId = req.query.userId || req.user.id;
  const { data } = await supabase.from('pre_tournament_picks').select('*').eq('user_id', userId).maybeSingle();
  res.json(data || null);
});

app.post('/api/pre-tournament', requireUser, async (req, res) => {
  const actor = req.adminUser || req.user;
  const { data: settingsRow } = await supabase.from('settings').select('copa_start_date').eq('id', 1).single();

  if (isTournamentStarted(settingsRow.copa_start_date) && actor.role !== 'admin') {
    return res.status(400).json({ error: 'Torneio já começou, palpites pré-torneio bloqueados' });
  }

  const effectiveUserId = req.body.user_id || req.user.id;
  const { data: existing } = await supabase.from('pre_tournament_picks').select('*').eq('user_id', effectiveUserId).maybeSingle();

  if (existing) {
    const { data: updated } = await supabase.from('pre_tournament_picks').update({ ...req.body, user_id: effectiveUserId }).eq('id', existing.id).select().single();
    await recalculateAllScores();
    return res.json(updated);
  }

  const pick = { id: uuidv4(), user_id: effectiveUserId, points: 0, ...req.body };
  await supabase.from('pre_tournament_picks').insert(pick);
  await recalculateAllScores();
  res.status(201).json(pick);
});

app.put('/api/pre-tournament/:id', requireUser, async (req, res) => {
  const actor = req.adminUser || req.user;
  const { data: settingsRow } = await supabase.from('settings').select('copa_start_date').eq('id', 1).single();

  if (isTournamentStarted(settingsRow.copa_start_date) && actor.role !== 'admin') {
    return res.status(400).json({ error: 'Torneio já começou, palpites pré-torneio bloqueados' });
  }

  const { data: existing } = await supabase.from('pre_tournament_picks').select('id').eq('id', req.params.id).limit(1);
  if (!existing?.length) return res.status(404).json({ error: 'Pick não encontrado' });

  const { data: updated } = await supabase.from('pre_tournament_picks').update(req.body).eq('id', req.params.id).select().single();
  await recalculateAllScores();
  res.json(updated);
});

// Extra results
app.get('/api/extra-results', requireUser, async (req, res) => {
  const { data } = await supabase.from('extra_results').select('*').eq('id', 1).single();
  const { id, ...result } = data;
  res.json(result);
});

app.put('/api/extra-results', requireUser, requireAdmin, async (req, res) => {
  await supabase.from('extra_results').update(req.body).eq('id', 1);
  const { data } = await supabase.from('extra_results').select('*').eq('id', 1).single();
  await recalculateAllScores();
  const { id, ...result } = data;
  res.json(result);
});

// Settings
app.get('/api/settings', requireUser, async (req, res) => {
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
  const { id, ...settings } = data;
  res.json(settings);
});

app.put('/api/settings', requireUser, requireAdmin, async (req, res) => {
  await supabase.from('settings').update(req.body).eq('id', 1);
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
  const { id, ...settings } = data;
  res.json(settings);
});

// Standings
app.get('/api/standings', async (req, res) => {
  const { data: users } = await supabase.from('users').select('id,display_name,username,score,score_breakdown,role').neq('role', 'admin').order('score', { ascending: false });
  const standings = (users || []).map((u, i) => ({ ...u, position: i + 1 }));
  res.json(standings);
});

const TEAM_PT = {
  'Africa': 'África do Sul',
  'South Africa': 'África do Sul',
  'Germany': 'Alemanha',
  'Saudi Arabia': 'Arábia Saudita',
  'Algeria': 'Argélia',
  'Argentina': 'Argentina',
  'Australia': 'Austrália',
  'Austria': 'Áustria',
  'Belgium': 'Bélgica',
  'Bosnia-Herzegovina': 'Bósnia e Herzegovina',
  'Bosnia and Herzegovina': 'Bósnia e Herzegovina',
  'Brazil': 'Brasil',
  'Cape Verde Islands': 'Cabo Verde',
  'Cape Verde': 'Cabo Verde',
  'Canada': 'Canadá',
  'Qatar': 'Catar',
  'Colombia': 'Colômbia',
  'South Korea': 'Coreia do Sul',
  'Korea Republic': 'Coreia do Sul',
  'Ivory Coast': 'Costa do Marfim',
  "Côte d'Ivoire": 'Costa do Marfim',
  'Croatia': 'Croácia',
  'Curaçao': 'Curaçao',
  'Egypt': 'Egito',
  'Ecuador': 'Equador',
  'Scotland': 'Escócia',
  'Spain': 'Espanha',
  'United States': 'Estados Unidos',
  'USA': 'Estados Unidos',
  'France': 'França',
  'Ghana': 'Gana',
  'Haiti': 'Haiti',
  'Netherlands': 'Holanda',
  'England': 'Inglaterra',
  'Iran': 'Irã',
  'Iraq': 'Iraque',
  'Japan': 'Japão',
  'Jordan': 'Jordânia',
  'Morocco': 'Marrocos',
  'Mexico': 'México',
  'Norway': 'Noruega',
  'New Zealand': 'Nova Zelândia',
  'Panama': 'Panamá',
  'Paraguay': 'Paraguai',
  'Portugal': 'Portugal',
  'DR Congo': 'República Democrática do Congo',
  'Congo DR': 'República Democrática do Congo',
  'Democratic Republic of Congo': 'República Democrática do Congo',
  'Sweden': 'Suécia',
  'Switzerland': 'Suíça',
  'Czechia': 'Tchéquia',
  'Czech Republic': 'Tchéquia',
  'Tunisia': 'Tunísia',
  'Turkey': 'Turquia',
  'Türkiye': 'Turquia',
  'Uruguay': 'Uruguai',
  'Uzbekistan': 'Uzbequistão',
};

function translateTeam(name) {
  return TEAM_PT[name] || name;
}

// Sync football-data.org
app.post('/api/sync', requireUser, requireAdmin, async (req, res) => {
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

    if (matchesData.matches) {
      for (const m of matchesData.matches) {
        const homeTeam = translateTeam(m.homeTeam?.name || m.homeTeam?.shortName || '');
        const awayTeam = translateTeam(m.awayTeam?.name || m.awayTeam?.shortName || '');
        const datetime = m.utcDate;
        const fdId = String(m.id);

        const { data: byFdId } = await supabase.from('matches').select('id').eq('football_data_id', fdId).limit(1);
        let existing = byFdId?.[0];

        if (!existing) {
          const { data: byTeams } = await supabase.from('matches').select('id').eq('team_a', homeTeam).eq('team_b', awayTeam).limit(1);
          existing = byTeams?.[0];
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
          const updates = { football_data_id: fdId, status, datetime };
          if (status === 'finished') {
            updates.score_a = score_a;
            updates.score_b = score_b;
          }
          await supabase.from('matches').update(updates).eq('id', existing.id);
          synced++;
        } else {
          await supabase.from('matches').insert({
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

    const extraUpdates = {};

    if (scorersData.scorers?.length > 0) {
      const top = scorersData.scorers[0];
      extraUpdates.top_scorer = top.player?.name || null;
    }

    if (standingsData.standings) {
      const groupStandings = standingsData.standings.filter(s => s.stage === 'GROUP_STAGE');
      let bestAttackTeam = null, bestAttackGoals = -1;
      let bestDefenseTeam = null, bestDefenseGoals = Infinity;

      for (const group of groupStandings) {
        for (const row of group.table || []) {
          if (row.goalsFor > bestAttackGoals) {
            bestAttackGoals = row.goalsFor;
            bestAttackTeam = translateTeam(row.team?.name) || null;
          }
          if (row.goalsAgainst < bestDefenseGoals) {
            bestDefenseGoals = row.goalsAgainst;
            bestDefenseTeam = translateTeam(row.team?.name) || null;
          }
        }
      }
      if (bestAttackTeam) extraUpdates.best_attack = bestAttackTeam;
      if (bestDefenseTeam) extraUpdates.best_defense = bestDefenseTeam;
    }

    if (Object.keys(extraUpdates).length) {
      await supabase.from('extra_results').update(extraUpdates).eq('id', 1);
    }

    await recalculateAllScores();
    res.json({ ok: true, synced, created, message: `${synced} jogos atualizados, ${created} criados` });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Erro ao sincronizar: ' + err.message });
  }
});

app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')));

app.listen(3001, () => console.log('Betolão server running on http://localhost:3001'));
