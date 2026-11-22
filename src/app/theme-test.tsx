import { Link } from 'expo-router';
import {
  CircleArrowDown,
  CircleArrowUp,
  Target,
  Wallet,
} from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader } from '@/components/card';
import { CategoryBadge } from '@/components/category-badge';
import { EmptyState } from '@/components/empty-state';
import { ErrorBox } from '@/components/error-box';
import { GoalCard } from '@/components/goals/goal-card';
import { Icon } from '@/components/icon';
import { SkeletonText } from '@/components/skeleton';
import { StatCard, StatCardSkeleton } from '@/components/stat-card';
import { Text as AppText } from '@/components/text';
import { TypeIcon } from '@/components/type-icon';
import { useHardShadow } from '@/lib/hard-shadow';
import type { Goal } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

// PROVISÓRIO (Etapa 3): vitrine para provar o NativeWind no SDK 58, os tokens
// e a sombra dura. Só em desenvolvimento; sai quando os componentes base existirem.

const SURFACES = [
  ['bg-background', 'background'],
  ['bg-surface', 'surface'],
  ['bg-surface-muted', 'surface-muted'],
  ['bg-band', 'band'],
] as const;

const ACCENTS = [
  ['bg-income', 'text-income-foreground', 'income ↑'],
  ['bg-expense', 'text-expense-foreground', 'expense ↓'],
  ['bg-warning', 'text-warning-foreground', 'warning'],
  ['bg-highlight', 'text-highlight-foreground', 'highlight'],
  ['bg-ai', 'text-ai-foreground', 'ai'],
  ['bg-danger', 'text-danger-foreground', 'danger'],
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" a `days` dias de hoje (negativo = no passado), no fuso local. */
function dateFromToday(days: number) {
  const d = new Date(Date.now() + days * DAY_MS);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Metas fictícias, uma por situação do ritmo. Datas relativas a hoje: criadas
 * há 180 dias com prazo daqui a 180, o esperado fica em torno de 50%.
 */
function sampleGoals(): Goal[] {
  const createdAt = new Date(Date.now() - 180 * DAY_MS).toISOString();
  const deadline = dateFromToday(180);
  return [
    {
      id: 'on-track',
      name: 'No ritmo (60% de ~50%)',
      targetAmount: 10000,
      currentAmount: 6000,
      deadline,
      createdAt,
    },
    {
      id: 'behind',
      name: 'Abaixo do ritmo (30% de ~50%)',
      targetAmount: 10000,
      currentAmount: 3000,
      deadline,
      createdAt,
    },
    {
      id: 'overdue',
      name: 'Prazo vencido (ontem)',
      targetAmount: 10000,
      currentAmount: 7000,
      deadline: dateFromToday(-1),
      createdAt,
    },
    {
      id: 'done',
      name: 'Concluída',
      targetAmount: 5000,
      currentAmount: 5000,
      deadline,
      createdAt,
    },
    {
      id: 'no-deadline',
      name: 'Sem prazo (5%)',
      targetAmount: 20000,
      currentAmount: 1000,
      deadline: null,
      createdAt,
    },
    // Backend sem a migration: com prazo, mas sem createdAt → income, sem aviso
    {
      id: 'no-created-at',
      name: 'Sem data de criação (30%)',
      targetAmount: 10000,
      currentAmount: 3000,
      deadline,
    },
  ];
}

export default function ThemeTest() {
  const scheme = useColorScheme();
  const shadowSm = useHardShadow('sm');
  const shadowMd = useHardShadow();
  const shadowLg = useHardShadow('lg');
  // Prova de que o onPress dispara (e que o disabled bloqueia)
  const [presses, setPresses] = useState(0);
  const press = () => setPresses((n) => n + 1);

  return (
    <ScrollView
      className='bg-background'
      contentContainerClassName='gap-4 p-6 pt-16'
    >
      <Text className='font-display text-2xl font-bold text-foreground'>
        vitrine do tema ({scheme})
      </Text>

      {/* 0. Fontes embutidas pelo plugin do expo-font (3ª build) */}
      <View className='gap-1 rounded-xl border-2 border-ink bg-surface p-4'>
        <Text className='font-sans text-foreground'>
          space grotesk 400 · R$ 1.234,56
        </Text>
        <Text className='font-sans font-medium text-foreground'>
          space grotesk 500 (font-medium) · R$ 1.234,56
        </Text>
        <Text className='font-sans font-bold text-foreground'>
          space grotesk 700 (font-bold) · R$ 1.234,56
        </Text>
        <Text className='font-display text-foreground'>space mono 400</Text>
        <Text className='font-display font-bold text-foreground'>
          space mono 700 (títulos)
        </Text>
        <Text className='text-foreground'>sem classe de fonte (sistema)</Text>
      </View>

      {/* 1. Classes padrão do Tailwind (prova do NativeWind) */}
      <View className='rounded-xl border-2 border-black bg-yellow-200 p-4'>
        <Text className='font-bold lowercase text-black'>
          1. CLASSES PADRÃO (DEVE FICAR EM MINÚSCULAS)
        </Text>
        <Text className='text-sm text-black'>
          fundo amarelo, borda preta de 2px, cantos arredondados
        </Text>
      </View>

      {/* 2. Tokens: devem trocar sozinhos entre claro e escuro */}
      <Text className='text-lg font-bold text-foreground'>2. tokens</Text>
      <View className='gap-2'>
        {SURFACES.map(([bg, name]) => (
          <View
            key={name}
            className={`${bg} rounded-lg border-2 border-ink px-3 py-2`}
          >
            <Text className='text-foreground'>{name}</Text>
            <Text className='text-sm text-muted-foreground'>
              muted-foreground
            </Text>
          </View>
        ))}
        <View className='rounded-lg border-2 border-border-custom bg-surface px-3 py-2'>
          <Text className='text-foreground'>borda fina border-custom</Text>
        </View>
        <View className='flex-row flex-wrap gap-2'>
          {ACCENTS.map(([bg, fg, label]) => (
            <View key={label} className={`${bg} rounded-md px-3 py-2`}>
              <Text className={`${fg} font-bold`}>{label}</Text>
            </View>
          ))}
        </View>
        <Text className='text-foreground'>
          <Text className='font-bold text-income'>↑ R$ 100,00</Text>
          {'  '}
          <Text className='font-bold text-expense'>↓ R$ 50,00</Text>
        </Text>
        <View className='rounded-lg border-2 border-danger-border bg-danger px-3 py-2'>
          <Text className='font-bold text-danger-foreground'>
            botão danger (claro: preenchido; escuro: contornado)
          </Text>
        </View>
      </View>

      {/* 3. Sombra dura pelo hook useHardShadow (sem desfoque, cor do --ink) */}
      <Text className='text-lg font-bold text-foreground'>3. sombra dura</Text>
      <View className='gap-6 pb-2 pr-2'>
        <View
          className='rounded-md border-2 border-ink bg-surface p-3'
          style={shadowSm}
        >
          <Text className='text-foreground'>
            sm: 2px (selos, itens pequenos)
          </Text>
        </View>
        <View
          className='rounded-2xl border-2 border-ink bg-surface p-4'
          style={shadowMd}
        >
          <Text className='text-foreground'>
            md: 4px (padrão: cards, botões)
          </Text>
        </View>
        <View
          className='rounded-2xl border-2 border-ink bg-surface p-4'
          style={shadowLg}
        >
          <Text className='text-foreground'>
            lg: 6px (diálogos, card de login)
          </Text>
        </View>
      </View>

      {/* 4. Componentes base (Etapa 3c) */}
      <AppText variant='title' className='text-lg lowercase'>
        4. componente text
      </AppText>
      <View className='gap-2 rounded-xl border-2 border-ink bg-surface p-4'>
        <AppText variant='title' className='text-xl lowercase'>
          título (space mono 700)
        </AppText>
        <AppText>corpo padrão: space grotesk, cor foreground</AppText>
        <AppText tone='muted' className='text-sm'>
          secundário: muted-foreground
        </AppText>
        <View className='gap-1'>
          <AppText tone='muted' className='text-sm'>
            valor: o 1 ocupa a mesma largura do 8 (colunas alinhadas)
          </AppText>
          <View className='flex-row justify-between'>
            <AppText tone='muted' className='text-sm'>
              com value
            </AppText>
            <View>
              <AppText variant='value' className='text-right font-bold'>
                R$ 1.111,11
              </AppText>
              <AppText variant='value' className='text-right font-bold'>
                R$ 8.888,88
              </AppText>
            </View>
          </View>
          <View className='flex-row justify-between'>
            <AppText tone='muted' className='text-sm'>
              sem value
            </AppText>
            <View>
              <AppText className='text-right font-bold'>R$ 1.111,11</AppText>
              <AppText className='text-right font-bold'>R$ 8.888,88</AppText>
            </View>
          </View>
        </View>
        <AppText variant='value' className='font-bold'>
          <AppText variant='value' tone='income' className='font-bold'>
            ↑ R$ 100,00
          </AppText>
          {'  '}
          <AppText variant='value' tone='expense' className='font-bold'>
            ↓ R$ 50,00
          </AppText>
          {'  '}
          <AppText variant='value' tone='warning' className='font-bold'>
            ! pendente
          </AppText>
        </AppText>
      </View>

      <AppText variant='title' className='text-lg lowercase'>
        5. componente button
      </AppText>
      <AppText tone='muted' className='text-sm'>
        segure para ver: adesivos afundam sobre a sombra; planos ganham fundo.
        toques: {presses}
      </AppText>
      <View className='gap-3 rounded-xl border-2 border-ink bg-surface p-4'>
        <View className='flex-row flex-wrap gap-3'>
          <Button onPress={press}>Salvar</Button>
          <Button variant='outline' onPress={press}>
            cancelar
          </Button>
          <Button variant='ghost' onPress={press}>
            ghost
          </Button>
        </View>
        <View className='flex-row flex-wrap gap-3'>
          <Button variant='ai' onPress={press}>
            importar ia
          </Button>
          <Button variant='danger' onPress={press}>
            excluir
          </Button>
        </View>
        <View className='flex-row flex-wrap items-center gap-3'>
          <Button size='sm' onPress={press}>
            sm
          </Button>
          <Button onPress={press}>md</Button>
          <Button size='lg' onPress={press}>
            lg
          </Button>
          <Button size='icon' accessibilityLabel='adicionar' onPress={press}>
            +
          </Button>
        </View>
        <View className='flex-row flex-wrap gap-3'>
          <Button disabled onPress={press}>
            desativado
          </Button>
          <Button variant='danger' disabled onPress={press}>
            excluir
          </Button>
          <Button variant='outline' disabled onPress={press}>
            cancelar
          </Button>
        </View>
        <Button size='lg' onPress={press}>
          largura total
        </Button>
      </View>

      <AppText variant='title' className='text-lg lowercase'>
        6. card e stat card
      </AppText>
      <View className='gap-6 pb-1 pr-1'>
        <Card>
          <CardHeader>
            Últimas Transações
            <AppText tone='band-foreground' className='text-sm'>
              Mercado do João
            </AppText>
          </CardHeader>
          <CardContent className='gap-2'>
            <AppText>
              faixa em band nos dois modos, nunca invertida. o rótulo da
              esquerda foi escrito em maiúsculas e aparece em minúsculas; o da
              direita é dado do usuário e fica como foi cadastrado.
            </AppText>
            <Button variant='outline' size='sm' className='self-start'>
              ver todas
            </Button>
          </CardContent>
        </Card>

        <StatCard
          label='Saldo'
          icon={<Icon icon={Wallet} tone='band-foreground' />}
          value={formatCurrency(12345.67)}
          note='atualizado agora'
        />
        <StatCard
          label='Receitas'
          icon={<Icon icon={CircleArrowUp} tone='band-foreground' />}
          value={formatCurrency(8000)}
          tone='income'
        />
        <StatCard
          label='Despesas'
          icon={<Icon icon={CircleArrowDown} tone='band-foreground' />}
          value={formatCurrency(123456.78)}
          tone='expense'
          note='valor de 6 dígitos para testar a largura em 360px'
        />
      </View>

      <AppText variant='title' className='text-lg lowercase'>
        7. estados e selos
      </AppText>
      <View className='gap-3 rounded-xl border-2 border-ink bg-surface p-4'>
        <AppText tone='muted' className='text-sm'>
          typeicon (o leitor de tela diz receita/despesa)
        </AppText>
        <View className='flex-row items-center gap-3'>
          <TypeIcon type='income' />
          <AppText variant='value' tone='income' className='font-bold'>
            R$ 100,00
          </AppText>
          <TypeIcon type='expense' />
          <AppText variant='value' tone='expense' className='font-bold'>
            R$ 50,00
          </AppText>
        </View>
        <AppText tone='muted' className='text-sm'>
          categorybadge (último: cor inválida &quot;bg-zinc-500&quot; → cinza)
        </AppText>
        <View className='flex-row flex-wrap gap-2'>
          <CategoryBadge name='Alimentação' color='#f59e0b' />
          <CategoryBadge name='SALÁRIO' color='#10b981' />
          <CategoryBadge name='Transporte' color='#3b82f6' />
          <CategoryBadge name={null} color='#ef4444' />
          <CategoryBadge name='Antiga' color='bg-zinc-500' />
        </View>
        <CategoryBadge
          name='Uma categoria com um nome comprido demais para caber na linha'
          color='#a855f7'
        />
      </View>

      <AppText tone='muted' className='text-sm'>
        skeleton ao lado do card carregado: as alturas devem bater, e o valor
        fica numa linha só (o de 6 dígitos diminui a fonte)
      </AppText>
      <View className='flex-row gap-3 pb-1 pr-1'>
        <View className='flex-1'>
          <StatCardSkeleton hasNote />
        </View>
        <View className='flex-1'>
          <StatCard
            label='Saldo'
            icon={<Icon icon={Wallet} tone='band-foreground' />}
            value={formatCurrency(1234)}
            note='atualizado agora'
          />
        </View>
      </View>
      <View className='flex-row gap-3 pb-1 pr-1'>
        <View className='flex-1'>
          <StatCardSkeleton />
        </View>
        <View className='flex-1'>
          <StatCard
            label='Despesas'
            icon={<Icon icon={CircleArrowDown} tone='band-foreground' />}
            value={formatCurrency(123456.78)}
            tone='expense'
          />
        </View>
      </View>
      <View className='gap-1'>
        <SkeletonText className='text-base' chars={20} />
        <SkeletonText className='text-sm' chars={30} tone='soft' />
      </View>

      <EmptyState
        icon={<Icon icon={Target} tone='muted' size={32} />}
        message='Nenhuma meta ainda. Crie a primeira e acompanhe quanto falta para chegar lá.'
      />
      <ErrorBox message='Não foi possível carregar as transações.' />
      <ErrorBox
        message='Sem conexão com o servidor. Verifique a internet.'
        onRetry={press}
      />

      <AppText variant='title' className='text-lg lowercase'>
        8. metas: cor pelo ritmo
      </AppText>
      <AppText tone='muted' className='text-sm'>
        dados fictícios; criadas há 180 dias, prazo daqui a 180 (esperado ~50%)
      </AppText>
      <View className='gap-6 pb-1 pr-1'>
        {sampleGoals().map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </View>

      <Link href='/' className='py-2 text-base text-foreground underline'>
        voltar
      </Link>
    </ScrollView>
  );
}
