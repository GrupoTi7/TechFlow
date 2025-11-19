import React from 'react';
import { Badge } from '@mantine/core';
import { differenceInDays, parseISO, isValid } from 'date-fns';

function StatusBadge({ nextDate }) {
  // Se não houver data, mostra N/D em cinza
  if (!nextDate) {
    return <Badge color="gray" variant="outline" size="sm">N/D</Badge>;
  }

  // Converte a data (se for string) para objeto Date
  const dateObj = typeof nextDate === 'string' ? parseISO(nextDate) : nextDate;
  
  // Validação extra para evitar erros se a data for inválida
  if (!isValid(dateObj)) {
    return <Badge color="gray" variant="outline" size="sm">Inválida</Badge>;
  }

  const today = new Date();
  const daysLeft = differenceInDays(dateObj, today);

  if (daysLeft < 0) {
    // Atrasada (Vermelho)
    return (
      <Badge color="red" variant="filled" size="sm">
        Vencida ({Math.abs(daysLeft)} dias)
      </Badge>
    );
  } else if (daysLeft <= 30) {
    // Próxima / Atenção (Amarelo/Laranja)
    return (
      <Badge color="yellow" variant="light" c="orange.9" size="sm">
        Atenção ({daysLeft} dias)
      </Badge>
    );
  } else {
    // Em dia (Verde)
    return (
      <Badge color="green" variant="light" size="sm">
        Em Dia ({daysLeft} dias)
      </Badge>
    );
  }
}

export default StatusBadge;