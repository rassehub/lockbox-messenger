import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Contact } from "../types/Contact";
import { StackParams } from "../../App";
import { useTheme } from "../ThemeContext";
import PlusButton from "./PlusButton";
import { useChat } from "../ChatContext";
import { useEffect, useState } from "react";

type ContactListItemProps = {
    usage: string;
    contact: Contact;
    chatIds: string[];
};

const ContactListItem: React.FC<ContactListItemProps> = ({ usage, contact, chatIds }) => {
    const { isDarkTheme } = useTheme();
    const { storage, refreshContacts, contactRefreshKey } = useChat();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();

    const [isOwn, setIsOwn] = useState(usage === "own");
    const [id, setId] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);

    const avatarSource = contact.avatarUrl
        ? { uri: contact.avatarUrl }
        : isDarkTheme
            ? require("../assets/avatar-dark.png")
            : require("../assets/avatar.png");

    const lastSeen = contact.lastSeen ?? "";

    useEffect(() => {
        if (usage === "own") setIsOwn(true);
    }, [usage]);

    useEffect(() => {
        const init = async () => {
            if (!storage) return;

            const chatList = await storage.getChatList();
            const existingChat = chatList.find(
                c => c.recipient === contact.userId && chatIds.includes(c.chatId)
            );
            if (existingChat) setId(existingChat.chatId);

            const ownContact = await storage.getContact(contact.userId);
            if (ownContact) setIsOwn(true);
        };

        void init();
    }, [storage, contact.userId, chatIds, contactRefreshKey]);

    const createChatId = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const handleAddContact = async () => {
        if (!storage || isOwn || isLoading) return;
        setIsLoading(true);
        setIsOwn(true); 
        try {
            await storage.saveContact(contact);
            refreshContacts();
        } catch (err) {
            setIsOwn(false); 
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChat = () => {
        if (isLoading) return;
        const resolvedChatId = id && id.trim() !== "" ? id : createChatId();
        navigation.navigate("Chat", {
            userId: contact.userId,
            chatId: contact.chatId ?? resolvedChatId,
        });
    };

    return (
        <View style={styles.contactListItem}>
            <Pressable style={styles.rowPressable} onPress={handleOpenChat}>
                <Image source={avatarSource} style={styles.avatar} />
                <View style={styles.contactInfo}>
                    <Text style={[styles.name, { color: isDarkTheme ? "#A8A5FF" : "#594EFF" }]}>
                        {contact.name}
                    </Text>
                    <Text style={styles.lastSeen}>
                        {lastSeen === ""
                            ? ""
                            : new Date(lastSeen).toLocaleDateString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                              })}
                    </Text>
                </View>
            </Pressable>

            {!isOwn && (
                isLoading ? (
                    <View style={styles.loaderWrap}>
                        <ActivityIndicator size="small" color="#A8A5FF" />
                    </View>
                ) : (
                    <PlusButton
                        onPress={() => {
                            void handleAddContact();
                        }}
                        styleProp={styles.plusButton}
                        iconStyleProp={styles.plusIcon}
                    />
                )
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    contactListItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
    },
    rowPressable: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        marginRight: 8,
    },
    contactInfo: {
        flex: 1,
        justifyContent: "space-around",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
    },
    lastSeen: {
        fontSize: 12,
        color: "#A8A5FF",
    },
    plusButton: {
        width: 24,
        height: 24,
        marginTop: 0,
    },
    plusIcon: {
        width: 20,
        height: 20,
    },
    loaderWrap: {
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
    },
});

export default ContactListItem;