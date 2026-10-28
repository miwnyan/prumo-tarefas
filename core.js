(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PrumoCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const priorities = ['baixa', 'normal', 'alta'];
  function validDate(value) {
    if (!value) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('Data inválida.');
    const d = new Date(value + 'T12:00:00Z');
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) throw Error('Data inválida.');
    return value;
  }
  function validate(input) {
    const title = String(input.title || '').trim();
    const detail = String(input.detail || '').trim();
    if (!title || title.length > 90) throw Error('O título deve ter de 1 a 90 caracteres.');
    if (detail.length > 500) throw Error('As notas devem ter até 500 caracteres.');
    return { title, detail, priority: priorities.includes(input.priority) ? input.priority : 'normal', due: validDate(input.due || '') };
  }
  function create(input, id, now) {
    return { id: id || crypto.randomUUID(), ...validate(input), done: false, createdAt: now || new Date().toISOString(), updatedAt: now || new Date().toISOString() };
  }
  function update(task, input, now) { return { ...task, ...validate(input), updatedAt: now || new Date().toISOString() }; }
  function filter(tasks, options) {
    const { status = 'todas', search = '', order = 'recentes' } = options || {};
    const q = search.trim().toLocaleLowerCase('pt-BR');
    const result = tasks.filter(t => (status === 'todas' || (status === 'pendentes' ? !t.done : t.done)) && (!q || (t.title + ' ' + t.detail).toLocaleLowerCase('pt-BR').includes(q)));
    return result.sort((a, b) => order === 'prazo' ? ((a.due || '9999').localeCompare(b.due || '9999') || b.createdAt.localeCompare(a.createdAt)) : b.createdAt.localeCompare(a.createdAt));
  }
  function progress(tasks) { return tasks.length ? Math.round(100 * tasks.filter(t => t.done).length / tasks.length) : 0; }
  return { create, update, filter, progress, validDate };
});
