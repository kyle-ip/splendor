import { DragFxProvider } from '@/features/solo/DragFx';
import { PurchaseFxProvider } from '@/features/solo/PurchaseFx';
import { SoloToastProvider } from '@/features/solo/SoloToast';
import { SoloHintsProvider } from '@/features/solo/SoloHints';
import { BankTakeFxProvider } from '@/features/solo/BankTakeFx';
import { CeremonyFxProvider } from '@/features/solo/CeremonyFx';
import { DuelPractice } from '@/features/duel/DuelPractice';

export function DuelPracticePage() {
  return (
    <DragFxProvider>
      <BankTakeFxProvider>
        <PurchaseFxProvider>
          <CeremonyFxProvider>
            <SoloToastProvider>
              <SoloHintsProvider>
                <DuelPractice />
              </SoloHintsProvider>
            </SoloToastProvider>
          </CeremonyFxProvider>
        </PurchaseFxProvider>
      </BankTakeFxProvider>
    </DragFxProvider>
  );
}
