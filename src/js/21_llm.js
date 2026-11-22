// ============================================================================
//  ELEMENTAL LAB — 21 · Optional LLM fallback (Layer E)
//  When enabled in Settings with the player's own Anthropic API key, pairs
//  that no hand-written rule covers (tag-rule / composite / fallback results)
//  are sent to Claude for a creative answer. Each answer is cached per pair,
//  so the same pair always gives the same result afterwards. Names that match
//  the procedural universe ("Frozen Dragon") map back onto existing items.
//  Without a key, the deterministic procedural generator is used instead.
// ============================================================================

const LLM_SHAPES = Object.keys(HEAD_SCORE);
const LLM_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Result name, 1-4 words, Title Case' },
    emoji: { type: 'string', description: 'One emoji that represents the result' },
    tags: { type: 'array', items: { type: 'string', enum: TAGS }, description: '2-6 tags that describe the result' },
    material: { type: 'string', enum: Object.keys(MATERIALS) },
    shape: { type: 'string', enum: LLM_SHAPES },
    tier: { type: 'integer', description: '1 (basic) to 10 (cosmic)' },
  },
  required: ['name', 'emoji', 'tags', 'material', 'shape', 'tier'],
  additionalProperties: false,
};

const LLM = {
  failures: 0, lastFail: 0, inflight: new Map(), client: null, clientKey: null,
  enabled() { return !!(Settings.ai && Settings.key && typeof Anthropic !== 'undefined'); },
  getClient() {
    if (!this.client || this.clientKey !== Settings.key) {
      // Browser use is intentional: the key is the player's own, typed into Settings and kept in localStorage.
      this.client = new Anthropic({ apiKey: Settings.key, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 15000 });
      this.clientKey = Settings.key;
    }
    return this.client;
  },

  async combine(idA, idB) {
    const key = pairKey(idA, idB);
    const cached = Universe.llmPairs.get(key);
    if (cached) return cached;
    if (this.failures >= 3 && Date.now() - this.lastFail < 60000) return null;
    if (this.inflight.has(key)) return this.inflight.get(key);
    const p = this.request(idA, idB, key).finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  },

  async request(idA, idB, key) {
    const A = Universe.get(idA), B = Universe.get(idB);
    const describe = (I) => `"${I.name}" ${I.emoji} (tags: ${I.tags.slice(0, 6).join(', ')})`;
    const model = Settings.model || 'claude-opus-5-5';
    const params = {
      model,
      max_tokens: 2048,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: LLM_SCHEMA } },
      system: 'You are the crafting oracle of Elemental Lab, a cozy 3D alchemy game in the spirit of Infinite Craft. '
        + 'Given two items, answer with the single most delightful, intuitive thing they make together: usually a concrete, recognizable noun or short phrase of 1-4 words. '
        + 'It can be a real-world thing, a creature, a place, a pop-culture-free invention or a playful mash-up. Never return either input unchanged. Keep it family friendly.',
      messages: [{ role: 'user', content: `Combine ${describe(A)} + ${describe(B)}. What do they make?` }],
    };
    const client = this.getClient();
    try {
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 14000));
      // Opus/Sonnet: opt into server-side refusal fallbacks; Haiku has no server-side fallback.
      const call = model.startsWith('claude-haiku')
        ? client.messages.create(params)
        : client.beta.messages.create({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
      const resp = await Promise.race([call, timeout]);
      if (resp.stop_reason === 'refusal' || resp.stop_reason === 'max_tokens') throw new Error(resp.stop_reason);
      const text = (resp.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
      const data = JSON.parse(text);
      if (!data || !data.name || data.name.length > 48) throw new Error('bad result');
      const name = data.name.trim().replace(/\s+/g, ' ');
      if (normName(name) === normName(A.name) || normName(name) === normName(B.name)) throw new Error('echoed input');
      let id = Universe.idFromName(name);
      if (!id) {
        id = Universe.registerLlmItem({
          name, emoji: [...(data.emoji || '✨')].slice(0, 2).join(''), tags: (data.tags || []).filter(t => TAG_INDEX.has(t)).slice(0, 6),
          material: data.material, shape: data.shape, tier: clamp(Math.round(data.tier || Math.max(A.tier, B.tier) + 1), 1, 10),
          rarity: clamp(Math.round(((data.tier || 5) - 1) / 2), 0, 5),
        });
      }
      Universe.llmPairs.set(key, id);
      Universe.combineCache.delete(key);
      this.failures = 0;
      Save.markDirty();
      return id;
    } catch (err) {
      this.failures++; this.lastFail = Date.now();
      let msg = String(err && err.message || err);
      if (typeof Anthropic !== 'undefined') {
        if (err instanceof Anthropic.AuthenticationError) msg = 'The API key was rejected.';
        else if (err instanceof Anthropic.RateLimitError) msg = 'Rate limited — using the procedural engine for a bit.';
        else if (err instanceof Anthropic.APIError) msg = `API error ${err.status}.`;
      }
      if (this.failures <= 2) UI.toast('🤖', 'Creative AI unavailable', msg + ' Falling back to the procedural generator.');
      return null;
    }
  },
};
