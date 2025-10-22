import express from 'express';
import { analyzeString } from './util.js';
import store from './data.js';

const app = express();
app.use(express.json());

const isSingleChar = (str) => typeof str === 'string' && str.length === 1;

app.post('/strings', (req, res) => {
  const { value } = req.body;

  if (value === undefined) {
    return res.status(400).json({ error: 'Missing "value" field' });
  }

  if (typeof value !== 'string') {
    return res.status(422).json({ error: '"value" must be a string' });
  }

  const result = analyzeString(value);

  if (store.has(result.id)) {
    return res.status(409).json({ error: 'String already exists' });
  }

  store.set(result.id, result);
  return res.status(201).json(result);
});


app.get('/strings/:value', (req, res) => {
  const searchValue = req.params.value;
  const result = [...store.values()].find(entry => entry.value === searchValue);

  if (!result) {
    return res.status(404).json({ error: 'String not found' });
  }

  return res.status(200).json(result);
});


app.get('/strings', (req, res) => {
  let results = [...store.values()];
  const { is_palindrome, min_length, max_length, word_count, contains_character } = req.query;
  const filters_applied = {};


  if (is_palindrome !== undefined) {
    if (is_palindrome !== 'true' && is_palindrome !== 'false') {
      return res.status(400).json({ error: 'Invalid value for is_palindrome; must be true or false' });
    }
    filters_applied.is_palindrome = is_palindrome === 'true';
    results = results.filter(r => r.properties.is_palindrome === filters_applied.is_palindrome);
  }

  if (min_length !== undefined) {
    const minLenNum = parseInt(min_length, 10);
    if (isNaN(minLenNum) || minLenNum < 0) {
      return res.status(400).json({ error: 'Invalid value for min_length; must be a non-negative integer' });
    }
    filters_applied.min_length = minLenNum;
    results = results.filter(r => r.properties.length >= minLenNum);
  }

  if (max_length !== undefined) {
    const maxLenNum = parseInt(max_length, 10);
    if (isNaN(maxLenNum) || maxLenNum < 0) {
      return res.status(400).json({ error: 'Invalid value for max_length; must be a non-negative integer' });
    }
    filters_applied.max_length = maxLenNum;
    results = results.filter(r => r.properties.length <= maxLenNum);
  }

  if (word_count !== undefined) {
    const wordCountNum = parseInt(word_count, 10);
    if (isNaN(wordCountNum) || wordCountNum < 0) {
      return res.status(400).json({ error: 'Invalid value for word_count; must be a non-negative integer' });
    }
    filters_applied.word_count = wordCountNum;
    results = results.filter(r => r.properties.word_count === wordCountNum);
  }


  if (contains_character !== undefined) {
    if (!isSingleChar(contains_character)) {
      return res.status(400).json({ error: 'Invalid value for contains_character; must be a single character' });
    }
    filters_applied.contains_character = contains_character;
    results = results.filter(r => r.value.includes(contains_character));
  }

  return res.status(200).json({
    data: results,
    count: results.length,
    filters_applied
  });
});

app.get('/strings/filter-by-natural-language', (req, res) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "query" parameter' });
  }

  const lower = query.toLowerCase();

  const parsedFilters = {};

  if (lower.includes('single word')) parsedFilters.word_count = 1;
  if (lower.includes('palindromic')) parsedFilters.is_palindrome = true;

  const minLengthMatch = lower.match(/longer than (\d+)/);
  if (minLengthMatch) {
    parsedFilters.min_length = parseInt(minLengthMatch[1], 10) + 1;
  }

  const containsCharMatch = lower.match(/containing the letter (\w)/);
  if (containsCharMatch) {
    parsedFilters.contains_character = containsCharMatch[1];
  }

  let results = [...store.values()];

  if ('word_count' in parsedFilters) {
    results = results.filter(r => r.properties.word_count === parsedFilters.word_count);
  }
  if ('is_palindrome' in parsedFilters) {
    results = results.filter(r => r.properties.is_palindrome === parsedFilters.is_palindrome);
  }
  if ('min_length' in parsedFilters) {
    results = results.filter(r => r.properties.length >= parsedFilters.min_length);
  }
  if ('contains_character' in parsedFilters) {
    results = results.filter(r => r.value.includes(parsedFilters.contains_character));
  }

  return res.status(200).json({
    data: results,
    count: results.length,
    interpreted_query: {
      original: query,
      parsed_filters: parsedFilters
    }
  });
});

app.delete('/strings/:value', (req, res) => {
  const target = req.params.value;
  const entry = [...store.values()].find(r => r.value === target);

  if (!entry) {
    return res.status(404).json({ error: 'String not found' });
  }

  store.delete(entry.id);
  return res.status(204).send();
});

const PORT =  3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
