import React from 'react';
import type { OrdemServico } from '../../types';
import { ModeloOficialDocumento } from './ModeloOficialDocumento';

interface ModeloOficialOrdemServicoProps {
  ordem: OrdemServico;
  isPrintOnly?: boolean;
}

export const ModeloOficialOrdemServico: React.FC<ModeloOficialOrdemServicoProps> = ({
  ordem,
  isPrintOnly = false,
}) => {
  return (
    <ModeloOficialDocumento
      ordem={ordem}
      isEditable={false}
      isPrintOnly={isPrintOnly}
    />
  );
};
