import { $ } from '../dom';

export function initModal(): void {
  const modal = $('modal');
  const closeModal = (): void => { modal.hidden = true; };
  $('about').onclick = () => { modal.hidden = false; };
  $('modalX').onclick = closeModal;
  modal.addEventListener('pointerdown', (e) => { if (e.target === modal) closeModal(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}
