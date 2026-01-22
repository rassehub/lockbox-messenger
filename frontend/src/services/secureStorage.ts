import * as Keychain from 'react-native-keychain';

class SecureStorage {
    private appName =  "com.lockbox"

    async saveSecureItem(key: string, value: unknown, service: string) {
        await Keychain.setGenericPassword(
            key,
            JSON.stringify(value),
            {service: `${this.appName}.${service}`}
        );
    }

    async getSecureItem<T>(key: string, service: string): Promise<T | null> {
        const itemValue = await Keychain.getGenericPassword({
            service: `${this.appName}.${service}`
        });

        if (!itemValue || itemValue.username !== key) {
            return null;
        }

        return JSON.parse(itemValue.password) as T;
    }

    async deleteSecureItem(service: string) {
        await Keychain.resetGenericPassword({
            service: `${this.appName}.${service}`
        })
    }
}