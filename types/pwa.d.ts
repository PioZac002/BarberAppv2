/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:pwa-register/react' {
    // @ts-ignore
    import type { FunctionComponent } from 'react'
    import type { RegisterSWOptions } from 'vite-plugin-pwa/types'

    export type { RegisterSWOptions }

    export function useRegisterSW(options?: RegisterSWOptions): {
        offlineReady: [boolean, (offlineReady: boolean) => void]
        needRefresh: [boolean, (needRefresh: boolean) => void]
        updateServiceWorker: (reloadPage?: boolean) => Promise<void>
    }
}
