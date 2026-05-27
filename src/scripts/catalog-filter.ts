import { $$ } from './dom';

export function initCatalogFilter(): void {
  const tabs = $$<HTMLElement>('.cat-tab');
  if (!tabs.length || tabs[0].dataset.bound) return;
  tabs.forEach(t => {
    t.dataset.bound = '1';
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const cat = t.dataset.cat;
      $$<HTMLElement>('[data-cat-item]').forEach(el => {
        el.hidden = !(cat === 'todos' || el.dataset.catItem === cat);
      });
    });
  });
}
