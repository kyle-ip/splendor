import { DragFxProvider } from '@/features/solo/DragFx';
import { PurchaseFxProvider } from '@/features/solo/PurchaseFx';
import { SoloToastProvider } from '@/features/solo/SoloToast';
import { SoloHintsProvider } from '@/features/solo/SoloHints';
import { BankTakeFxProvider } from '@/features/solo/BankTakeFx';
import { CeremonyFxProvider } from '@/features/solo/CeremonyFx';
import { StandardPractice } from '@/features/standard/StandardPractice';

export function StandardPracticePage() {
  return (
    <DragFxProvider>
      <BankTakeFxProvider>
        <PurchaseFxProvider>
          <CeremonyFxProvider>
            <SoloToastProvider>
              <SoloHintsProvider>
                <StandardPractice />
              </SoloHintsProvider>
            </SoloToastProvider>
          </CeremonyFxProvider>
        </PurchaseFxProvider>
      </BankTakeFxProvider>
    </DragFxProvider>
  );
}
