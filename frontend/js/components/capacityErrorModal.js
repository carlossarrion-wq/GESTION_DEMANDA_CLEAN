/**
 * Capacity Error Modal Component
 * Shows capacity conflicts in a user-friendly format
 */

export function showCapacityErrorModal(results) {
    console.log('[capacityErrorModal] Function called with:', results);
    
    // Remove existing modal if any
    const existingModal = document.getElementById('capacity-error-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Extract capacity errors
    const capacityErrors = results.errors.filter(e => e.type === 'CAPACITY_EXCEEDED');
    console.log('[capacityErrorModal] Capacity errors:', capacityErrors.length);
    
    // Group errors by resource + date to handle duplicate resource rows
    const errorsByResourceAndDate = new Map();
    
    capacityErrors.forEach((error, index) => {
        const { assignment, error: errorMessage } = error;
        const resourceName = assignment.resourceName || 'Recurso desconocido';
        
        // Create unique key: resourceName + index to handle duplicate resources
        const uniqueKey = `${resourceName}_${index}`;
        
        // Parse error message to extract details
        const match = errorMessage.match(/Available: (\d+) hours, Requested: (\d+) hours, Assigned: (\d+) hours/);
        
        errorsByResourceAndDate.set(uniqueKey, {
            resourceName: resourceName,
            date: assignment.date,
            requested: match ? parseInt(match[2]) : 0,
            available: match ? parseInt(match[1]) : 0,
            assigned: match ? parseInt(match[3]) : 0,
            task: assignment.title
        });
    });

    // Create modal HTML - simplified style matching delete confirmation modal
    const modalHTML = `
        <div id="capacity-error-modal" class="modal-overlay active" style="z-index: 10000; display: flex !important;">
            <div class="modal-container" style="max-width: 600px;">
                <div class="modal-header" style="background: #EDF4F4; border-bottom: none;">
                    <h2 style="color: #000000; display: flex; align-items: center; gap: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 24px; height: 24px;">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        Conflictos de Capacidad
                    </h2>
                    <button class="modal-close" id="close-capacity-error-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="font-size: 1.1rem; margin-bottom: 1rem; color: #000000;">
                        Se superó la capacidad disponible en <strong>${results.failed} asignación(es)</strong>
                    </p>
                    <div style="background: #F7E6E5; border-left: 4px solid #dc2626; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
                        <p style="color: #7F3E1A; font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 20px; height: 20px;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            Detalles de los conflictos:
                        </p>
                        <div style="color: #7F3E1A; margin: 0;">
                            ${Array.from(errorsByResourceAndDate.entries()).map(([key, error], index) => {
                                const dateObj = new Date(error.date);
                                const formattedDate = dateObj.toLocaleDateString('es-ES', { 
                                    day: 'numeric',
                                    month: 'short'
                                });
                                const excess = error.requested - error.available;
                                return `
                                    <div style="margin-bottom: 0.75rem;">
                                        <strong>${error.resourceName}:</strong>
                                        <ul style="margin: 0.25rem 0 0 1.5rem; padding: 0;">
                                            <li>${formattedDate}: Exceso de ${excess}h (Disponible: ${error.available}h, Solicitado: ${error.requested}h)</li>
                                        </ul>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <p style="color: #6b7280; font-size: 0.95rem; margin: 0;">
                        Por favor, abre el modal de <strong>Gestión de Capacidad</strong> para revisar la disponibilidad de cada recurso y ajustar las asignaciones.
                    </p>
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 1rem;">
                    <button type="button" class="btn btn-secondary" id="close-capacity-error-btn" style="background: #d1e7dd; border-color: #badbcc; color: #0f5132;">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add event listeners
    const modal = document.getElementById('capacity-error-modal');
    console.log('[capacityErrorModal] Modal element:', modal);
    const closeBtn = document.getElementById('close-capacity-error-modal');
    const closeFooterBtn = document.getElementById('close-capacity-error-btn');

    const closeModal = () => {
        modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    closeFooterBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
}
