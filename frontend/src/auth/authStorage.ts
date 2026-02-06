import { SecureStorage } from "../storage/secureStorage";
import AuthStorageSchema from './authStorage.schema'
import { authCodecs } from "./authStorage.codecs";

export class AuthStorage {
    private secureStorage;

    constructor() {
    this.secureStorage = new SecureStorage<AuthStorageSchema, typeof authCodecs>("global.sessions", authCodecs);
   }

    async storeAuthSession(session: string, refresh: string,  userId: string) {
        await this.secureStorage.upsertRecordItem("sessions", userId, {
            session: session,
            refresh: refresh
        })
    }

    async removeAuthSession(userId: string) {
        await this.secureStorage.removeRecordItem("sessions", userId);
    }

    async loadAuthSession(userId: string): Promise<{sessionToken: string, refreshToken: string}| undefined> {
        const session = await this.secureStorage.getRecordItem("sessions", userId);
        if(session)
            return {
                sessionToken: session.session,
                refreshToken: session.refresh,
            }
        return undefined;
    }

    async getLatestUser(): Promise<string | undefined> {
        const userId = await this.secureStorage.getItem("latestSession");
        return userId ? userId : undefined
    }

    async setLatestUser(userId: string): Promise<void> {
        return await this.secureStorage.setItem("latestSession", userId);
    }

    async updateSessionToken(userId: string, token: string) {
        const currentRecord = await this.secureStorage.getRecordItem("sessions", userId);
        let newRecord;
        if (currentRecord){
            newRecord = {
                session: token,
                refresh: currentRecord.refresh,
            }
            await this.secureStorage.upsertRecordItem("sessions", userId, newRecord)
        }
    }

    async updateRefreshToken(userId: string, token: string) {
        const currentRecord = await this.secureStorage.getRecordItem("sessions", userId);
        let newRecord;
        if (currentRecord){
            newRecord = {
                session: currentRecord.session,
                refresh: token,
            }
            await this.secureStorage.upsertRecordItem("sessions", userId, newRecord)
        }
    }

    async loadExistingSession(): Promise<{
        userId: string,
        sessionToken: string,
        refreshToken: string,
    } | undefined> {
        const user = await this.getLatestUser();
        let session;
        if(user) {
            session = await this.loadAuthSession(user);
            return session ? {
                userId: user,
                sessionToken: session.sessionToken,
                refreshToken: session.refreshToken,    
            }: undefined;
        }
        return undefined;
    }
}