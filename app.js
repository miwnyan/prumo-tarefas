(() => {
  'use strict';
  const K = 'prumo.tasks.v1';
  const LEGACY_K = 'pauta.tasks.v1';
  const $ = id => document.getElementById(id);
  const today = new Date();
  const dateLocal = d => [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  const fmt = value => new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(value + 'T12:00:00'));
  let tasks = [];
  let activeFilter = 'todas';
  let editing = null;
  let toastTimer;
  try { const saved = JSON.parse(localStorage.getItem(K) || localStorage.getItem(LEGACY_K) || '[]'); tasks = Array.isArray(saved) ? saved.filter(t => t && typeof t.title === 'string' && typeof t.id === 'string') : []; } catch { tasks = []; }
  $('today').textContent = new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'long',year:'numeric'}).format(today);
  function note(text) { clearTimeout(toastTimer); $('toast').textContent=text; $('toast').hidden=false; toastTimer=setTimeout(()=>$('toast').hidden=true,3000); }
  function persist() { try { localStorage.setItem(K,JSON.stringify(tasks)); return true; } catch { note('Armazenamento indisponível. Mudanças só nesta sessão.'); return false; } }
  function el(tag, className, text) { const node=document.createElement(tag); if(className) node.className=className; if(text!==undefined) node.textContent=text; return node; }
  function render() {
    const done=tasks.filter(t=>t.done).length;
    $('fraction').textContent=`${done} / ${tasks.length}`;
    $('percent').textContent=PrumoCore.progress(tasks)+'%';
    $('meter-fill').style.width=PrumoCore.progress(tasks)+'%';
    $('count-all').textContent=tasks.length;
    $('count-open').textContent=tasks.length-done;
    $('count-done').textContent=done;
    const matches=PrumoCore.filter(tasks,{status:activeFilter,search:$('search').value,order:$('order').value});
    $('visible-count').textContent=String(matches.length).padStart(2,'0');
    $('list').replaceChildren();
    $('empty').hidden=matches.length>0;
    if(!matches.length){ const filtered=tasks.length>0; $('empty-title').textContent=filtered?'Nenhuma tarefa encontrada.':'Sua lista está em branco.'; $('empty-text').textContent=filtered?'Tente outro termo ou filtro.':'Comece criando a primeira tarefa.'; $('empty-add').hidden=filtered; }
    matches.forEach(task => {
      const row=el('article','task-row'+(task.done?' is-done':''));
      const checkbox=el('input','task-check'); checkbox.type='checkbox'; checkbox.checked=!!task.done;
      checkbox.setAttribute('aria-label',task.done?`Marcar ${task.title} como pendente`:`Concluir ${task.title}`);
      checkbox.addEventListener('change',()=>{task.done=checkbox.checked;task.updatedAt=new Date().toISOString();persist();render();});
      const content=el('div'); content.append(el('div','task-name',task.title));
      if(task.detail) content.append(el('div','task-notes',task.detail));
      const meta=el('div','task-meta'); meta.append(el('span',task.priority==='alta'?'priority-high':'',`PRIORIDADE ${task.priority.toUpperCase()}`));
      if(task.due) meta.append(el('span',!task.done && task.due<dateLocal(new Date())?'overdue':'',`${task.due<dateLocal(new Date())&&!task.done?'ATRASADA · ':''}${fmt(task.due)}`));
      content.append(meta);
      const actions=el('div','task-actions'); const edit=el('button','', 'Editar'); edit.type='button'; edit.addEventListener('click',()=>openEditor(task));
      const remove=el('button','','Excluir'); remove.type='button'; remove.addEventListener('click',()=>{ if(confirm(`Excluir a tarefa “${task.title}”?`)){tasks=tasks.filter(t=>t.id!==task.id);persist();render();note('Tarefa excluída.');} });
      actions.append(edit,remove); row.append(checkbox,content,actions); $('list').append(row);
    });
  }
  function openEditor(task){editing=task?.id||null;$('task-form').reset();$('form-error').hidden=true;$('dialog-title').textContent=task?'Editar tarefa':'Nova tarefa';if(task){for(const name of ['title','detail','priority','due']) $('task-form').elements.namedItem(name).value=task[name]||'';} $('editor').showModal(); $('task-form').elements.namedItem('title').focus();}
  $('add').addEventListener('click',()=>openEditor());$('empty-add').addEventListener('click',()=>openEditor());
  $('cancel').addEventListener('click',()=>$('editor').close());$('close').addEventListener('click',()=>$('editor').close());
  $('task-form').addEventListener('submit',event=>{event.preventDefault();const f=event.currentTarget;const input=Object.fromEntries(new FormData(f).entries());try{const original=tasks.find(t=>t.id===editing);if(original){tasks=tasks.map(t=>t.id===editing?PrumoCore.update(t,input):t);}else{tasks.unshift(PrumoCore.create(input));}persist();$('editor').close();render();note(original?'Tarefa atualizada.':'Tarefa criada.');}catch(err){$('form-error').textContent=err.message;$('form-error').hidden=false;}});
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{activeFilter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{const on=b===button;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});render();}));
  $('search').addEventListener('input',render);$('order').addEventListener('change',render);
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('search').focus();}if(e.key==='n'&&!e.ctrlKey&&!e.metaKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)&&!$('editor').open){openEditor();}});
  render();
})();
