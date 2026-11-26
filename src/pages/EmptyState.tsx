import type { ReactNode } from 'react';
import { Icon, type IconName } from '../components/Icon.tsx';

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="ar-empty" style={{ marginTop: 24 }}>
      <Icon name={icon} size={28} />
      <h1 className="ar-h3" style={{ margin: 0 }}>{title}</h1>
      {body ? <span className="ar-muted">{body}</span> : null}
      {action}
    </div>
  );
}
