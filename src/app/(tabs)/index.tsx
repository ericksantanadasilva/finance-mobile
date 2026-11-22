import { LayoutDashboard } from 'lucide-react-native';

import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { Page } from '@/components/page';

// Provisório (4a): os dados entram na 4b
export default function Overview() {
  return (
    <Page title='Visão Geral'>
      <EmptyState
        icon={<Icon icon={LayoutDashboard} tone='muted' size={32} />}
        message='O resumo do mês aparece aqui.'
      />
    </Page>
  );
}
