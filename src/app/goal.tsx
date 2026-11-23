import { useState } from 'react';

import { FormScreen } from '@/components/form-screen';
import { GoalForm } from '@/components/goals/goal-form';

/** Criar meta (/goal). Editar e excluir ainda não existem na API. */
export default function GoalScreen() {
  const [saving, setSaving] = useState(false);

  return (
    <FormScreen title='Nova meta' closeDisabled={saving}>
      <GoalForm onSavingChange={setSaving} />
    </FormScreen>
  );
}
