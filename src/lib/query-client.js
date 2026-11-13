import { QueryClient } from '@tanstack/react-query';
import { IS_NATIVE } from '@/native/useIsNative';

// En la app Android las consultas y los cambios se ejecutan siempre (aunque no haya internet):
// sin conexión leen la copia local y guardan en la cola. En la web se conserva el comportamiento de siempre.
const networkMode = IS_NATIVE ? 'always' : 'online';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			networkMode,
		},
		mutations: { networkMode },
	},
});
