import express from 'express';
import { analyzeString } from './util.js';
import store from './data.js';

const app = express();
app.use(express.json());

app.post('/strings', (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'Missing "value" field' });
  if (typeof value !== 'string') return res.status(422).json({ error: '"value" must be a string' });

  const result = analyzeString(value);
  if (store.has(result.id)) return res.status(409).json({ error: 'String already exists' });

  store.set(result.id, result);
  return res.status(201).json(result);
});
app.get('/strings/:value', (req, res) => {
  const searchValue = req.params.value;
  const result = [...store.values()].find((entry) => entry.value === searchValue);

  if (!result) return res.status(404).json({ error: 'String not found' });
  return res.status(200).json(result);
});

app.get('/strings', (req, res) => {
  let results = [...store.values()];
  const { is_palindrome, min_length, max_length, word_count, contains_character } = req.query;

  const filters_applied = {};

  if (is_palindrome !== undefined) {
    filters_applied.is_palindrome = is_palindrome === 'true';
    results = results.filter(r => r.properties.is_palindrome === filters_applied.is_palindrome);
  }

  if (min_length !== undefined) {
    filters_applied.min_length = parseInt(min_length);
    results = results.filter(r => r.properties.length >= filters_applied.min_length);
  }

  if (max_length !== undefined) {
    filters_applied.max_length = parseInt(max_length);
    results = results.filter(r => r.properties.length <= filters_applied.max_length);
  }

  if (word_count !== undefined) {
    filters_applied.word_count = parseInt(word_count);
    results = results.filter(r => r.properties.word_count === filters_applied.word_count);
  }

  if (contains_character !== undefined) {
    filters_applied.contains_character = contains_character;
    results = results.filter(r => r.value.includes(contains_character));
  }

  res.json({
    data: results,
    count: results.length,
    filters_applied
  });
});

app.delete('/strings/:value', (req, res) => {
  const target = req.params.value;
  const entry = [...store.values()].find(r => r.value === target);
  if (!entry) return res.status(404).json({ error: 'String not found' });

  store.delete(entry.id);
  return res.status(204).send();
});


const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
