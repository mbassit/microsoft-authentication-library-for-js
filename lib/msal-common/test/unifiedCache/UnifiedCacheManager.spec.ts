import { expect } from "chai";
import { UnifiedCacheManager } from "../../src/unifiedCache/UnifiedCacheManager";
import { mockCache } from "./entities/cacheConstants";
import { InMemoryCache, CredentialFilter, AccountFilter} from "../../src/unifiedCache/utils/CacheTypes";
import { ICacheStorage } from "../../src/cache/ICacheStorage";
import { Deserializer } from "../../src/unifiedCache/serialize/Deserializer";
import { AccountEntity } from "../../src/unifiedCache/entities/AccountEntity";
import { AccessTokenEntity } from "../../src/unifiedCache/entities/AccessTokenEntity";
import { CacheSchemaType, CacheHelper, CredentialType } from "../../src";
import { IdTokenEntity } from "../../src/unifiedCache/entities/IdTokenEntity";
import { RefreshTokenEntity } from "../../src/unifiedCache/entities/RefreshTokenEntity";
import { AppMetadataEntity } from "../../src/unifiedCache/entities/AppMetadataEntity";

const cacheJson = require("./serialize/cache.json");

describe("UnifiedCacheManager test cases", () => {
    let store = {};
    let storageInterface: ICacheStorage;
    const cache = JSON.stringify(cacheJson);
    const inMemCache: InMemoryCache = Deserializer.deserializeAllCache(
        Deserializer.deserializeJSONBlob(cache)
    );

    beforeEach(() => {
        storageInterface = {
            getCache(): InMemoryCache {
                return inMemCache;
            },
            setCache(inMemCache): void {
                this.inMemCache = inMemCache;
            },
            setItem(key: string, value: string): void {
                store[key] = value;
            },
            setItemInMemory(key: string, value: object, type?: string): void {
                // read inMemoryCache
                const cache = this.getCache();

                // save the cacheItem
                switch (type) {
                    case CacheSchemaType.ACCOUNT: {
                        cache.accounts[key] = value as AccountEntity;
                        break;
                    }
                    case CacheSchemaType.CREDENTIAL: {
                        const credentialType = CacheHelper.getCredentialType(key);
                        console.log(credentialType);
                        switch (credentialType) {
                            case CredentialType.ID_TOKEN: {
                                cache.idTokens[key] = value as IdTokenEntity;
                                break;
                            }
                            case CredentialType.ACCESS_TOKEN: {
                                cache.accessTokens[key] = value as AccessTokenEntity;
                                console.log(value);
                                break;
                            }
                            case CredentialType.REFRESH_TOKEN: {
                                cache.refreshTokens[key] = value as RefreshTokenEntity;
                                break;
                            }
                        }
                        break;
                    }
                    case CacheSchemaType.APP_META_DATA: {
                        cache.appMetadata[key] = value as AppMetadataEntity;
                        break;
                    }
                    default: {
                        console.log("Invalid Cache Type");
                        return;
                    }
                }

                // update inMemoryCache
                this.setCache(cache);
            },
            getItem(key: string): string {
                return store[key];
            },
            getItemFromMemory(key: string, type?: string): object {
                // read inMemoryCache
                const cache = this.getCache();

                // save the cacheItem
                switch (type) {
                    case CacheSchemaType.ACCOUNT: {
                        return cache.accounts[key] as AccountEntity || null;
                    }
                    case CacheSchemaType.CREDENTIAL: {
                        const credentialType = CacheHelper.getCredentialType(key);
                        let credential = null;
                        switch (credentialType) {
                            case CredentialType.ID_TOKEN: {
                                credential = cache.idTokens[key] as IdTokenEntity || null;
                                break;
                            }
                            case CredentialType.ACCESS_TOKEN: {
                                credential = cache.accessTokens[key] as AccessTokenEntity || null;
                                break;
                            }
                            case CredentialType.REFRESH_TOKEN: {
                                credential = cache.refreshTokens[key] as RefreshTokenEntity || null;
                                break;
                            }
                        }
                        return credential!;
                    }
                    case CacheSchemaType.APP_META_DATA: {
                        return cache.appMetadata[key] as AppMetadataEntity || null;
                    }
                    default: {
                        console.log("Invalid Cache Type");
                        return {};
                    }
                }
            },
            removeItem(key: string): boolean {
                delete store[key];
                return true;
            },
            removeItemFromMemory(key: string, type?: string): boolean {
                // read inMemoryCache
                const cache = this.getCache();
                let result: boolean = false;

                // save the cacheItem
                switch (type) {
                    case CacheSchemaType.ACCOUNT: {
                        if (!!cache.accounts[key]) {
                            delete cache.accounts[key];
                            result = true;
                        }
                        break;
                    }
                    case CacheSchemaType.CREDENTIAL: {
                        const credentialType = CacheHelper.getCredentialType(key);
                        switch (credentialType) {
                            case CredentialType.ID_TOKEN: {
                                if (!!cache.idTokens[key]) {
                                    delete cache.idTokens[key];
                                    result = true;
                                }
                                break;
                            }
                            case CredentialType.ACCESS_TOKEN: {
                                if (!!cache.accessTokens[key]) {
                                    delete cache.accessTokens[key];
                                    result = true;
                                }
                                break;
                            }
                            case CredentialType.REFRESH_TOKEN: {
                                if (!!cache.refreshTokens[key]) {
                                    delete cache.refreshTokens[key];
                                    result = true;
                                }
                                break;
                            }
                        }
                        break;
                    }
                    case CacheSchemaType.APP_META_DATA: {
                        if (!!cache.appMetadata[key]) {
                            delete cache.appMetadata[key];
                            result = true;
                        }
                        break;
                    }
                    default: {
                        console.log("Invalid Cache Type");
                        break;
                    }
                }

                // write to the cache after removal
                if (result) {
                    this.setCache(cache);
                }
                return result;
            },
            containsKey(key: string): boolean {
                return !!store[key];
            },
            getKeys(): string[] {
                return Object.keys(store);
            },
            clear(): void {
                store = {};
            },
        };
    });

    it("initCache", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        // create mock AccessToken
        const atOne = mockCache.createMockATOne();
        const atOneKey = atOne.generateCredentialKey();
        const atTwo = mockCache.createMockATTwo();
        const atTwoKey = atTwo.generateCredentialKey();

        expect(
            Object.keys(unifiedCacheManager.getCacheInMemory().accessTokens)
                .length
        ).to.equal(2);
        expect(
            unifiedCacheManager.getCacheInMemory().accessTokens[atOneKey]
        ).to.eql(atOne);
        expect(
            unifiedCacheManager.getCacheInMemory().accessTokens[atTwoKey]
        ).to.eql(atTwo);
    });

    it("save account", () => {
        let ac = new AccountEntity();
        Object.assign(ac, {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            realm: "microsoft",
            localAccountId: "object1234",
            username: "Jane Goodman",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJzb21lVWlkIiwgInV0aWQiOiJzb21lVXRpZCJ9",
        });

        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        const accountKey = ac.generateAccountKey();
        unifiedCacheManager.saveAccount(ac);
        expect(
            unifiedCacheManager.getCacheInMemory().accounts[accountKey]
                .homeAccountId
        ).to.eql("someUid.someUtid");
    });

    it("save credential", () => {
        let at = new AccessTokenEntity();
        Object.assign(at, {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken",
            clientId: "mock_client_id",
            secret: "an access token sample",
            realm: "microsoft",
            target: "scope6 scope7",
            cachedAt: "1000",
            expiresOn: "4600",
            extendedExpiresOn: "4600",
        });

        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);
        const atKey = at.generateCredentialKey();
        unifiedCacheManager.saveCredential(at);
        expect(
            unifiedCacheManager.getCacheInMemory().accessTokens[atKey]
                .homeAccountId
        ).to.eql("someUid.someUtid");
    });

    it("getAccount", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        expect(
            unifiedCacheManager.getAccount(
                "someuid.someutid-login.microsoftonline.com-microsoft"
            ).homeAccountId
        ).to.eql("someUid.someUtid");
    });

    it("getCredential", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        expect(
            unifiedCacheManager.getCredential(
                "someuid.someutid-login.microsoftonline.com-accesstoken-mock_client_id-microsoft-scope6 scope7"
            ).homeAccountId
        ).to.eql("someUid.someUtid");
    });

    it("getAccounts", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        const filterOne: AccountFilter = { homeAccountId: "uid.utid" };
        let accounts = unifiedCacheManager.getAccountsFilteredBy(filterOne);
        expect(Object.keys(accounts).length).to.eql(1);

        const filterTwo: AccountFilter = { environment: "login.microsoftonline.com" };
        accounts = unifiedCacheManager.getAccountsFilteredBy(filterTwo);
        expect(Object.keys(accounts).length).to.eql(2);
    });

    it("getCredentials", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        // filter by homeAccountId
        const filterOne: CredentialFilter = { homeAccountId: "uid.utid" };
        let credentials = unifiedCacheManager.getCredentialsFilteredBy(filterOne);
        expect(Object.keys(credentials.idTokens).length).to.eql(1);
        expect(Object.keys(credentials.accessTokens).length).to.eql(2);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(2);

        // filter by homeAccountId
        const filterTwo: CredentialFilter = { homeAccountId: "someuid.someutid" };
        credentials = unifiedCacheManager.getCredentialsFilteredBy(filterTwo);
        expect(Object.keys(credentials.idTokens).length).to.eql(0);
        expect(Object.keys(credentials.accessTokens).length).to.eql(1);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

        // filter by target
        const filterThree = { target: "scope1 scope2 scope3" };
        credentials = unifiedCacheManager.getCredentialsFilteredBy(filterThree);
        console.log(credentials.accessTokens);
    });

    it("removeAccount", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        let ac = new AccountEntity();
        Object.assign(ac, {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            realm: "microsoft",
            localAccountId: "object1234",
            username: "Jane Goodman",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJzb21lVWlkIiwgInV0aWQiOiJzb21lVXRpZCJ9",
        });

        unifiedCacheManager.removeAccount(ac);
        const accountKey = ac.generateAccountKey();
        expect(
            unifiedCacheManager.getCacheInMemory().accounts[accountKey]
        ).to.eql(undefined);
    });

    it("removeCredential", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        let at = new AccessTokenEntity();
        Object.assign(at, {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken",
            clientId: "mock_client_id",
            secret: "an access token sample",
            realm: "microsoft",
            target: "scope6 scope7",
            cachedAt: "1000",
            expiresOn: "4600",
            extendedExpiresOn: "4600",
        });

        unifiedCacheManager.removeCredential(at);
        const atKey = at.generateCredentialKey();
        expect(
            unifiedCacheManager.getCacheInMemory().accessTokens[atKey]
        ).to.eql(undefined);
    });
});
