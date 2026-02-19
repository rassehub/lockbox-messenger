import type AuthStorageSchema from './authStorageSchema'

const authMapCodec = {
    encode: (value: Record<string, {session: string, refresh: string}> ): string =>
        JSON.stringify(
            Object.fromEntries(
                Object.entries(value).map(([id, s]) => [
                    id,
                    {
                    session: s.session,
                    refresh: s.refresh,
                    }

                ])
            )
        ),
    decode:  (raw: string): Record<string, {session: string, refresh: string}> => {
        const parsed = JSON.parse(raw)
        return Object.fromEntries(
            Object.entries(parsed).map(([id, s]: any) => [
                id,
                {
                    session: s.session,
                    refresh: s.refresh,
                }
            ])
        );
    },
};

const latestSession = {
    encode: (value: string): string => value,
    decode: (raw: string): string => raw

};

export const authCodecs: {
    [K in keyof AuthStorageSchema]: {
        encode: (value: AuthStorageSchema[K]) => string;
        decode: (raw: string) => AuthStorageSchema[K];
    };
} = { 
    sessions: authMapCodec,
    latestSession: latestSession,
}