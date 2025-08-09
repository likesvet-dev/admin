'use client';

import { useStoreModal } from "@/hooks/use-store-modal";
import { Modal } from "@/components/ui/modal";

export const StoreModal = () => {
    const storeModal = useStoreModal();

    return (
        <Modal title="Создать магазин" description="Создайте магазин, чтобы начать продавать, управлять товары и заказы." isOpen={storeModal.isOpen} onClose={storeModal.onClose}>
            create store form
        </Modal>
    );
}