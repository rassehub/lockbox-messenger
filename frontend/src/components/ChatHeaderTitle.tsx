import { useNavigation } from "@react-navigation/native";
import { useChat } from "../ChatContext";
import { useTheme } from "../ThemeContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity } from "react-native";

const ChatHeaderTitle: React.FC<{ chatId: string }> = ({ chatId }) => {
  const { isDarkTheme } = useTheme();
  const { storage } = useChat();
  const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();
  const [name, setName] = useState<string>('Unknown');
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!storage) return;
      const msgs = (await storage.getMessages(chatId)) ?? [];

      const contactId =
        msgs.find((m) => (m as any).contactID)?.contactID ??
        msgs[msgs.length - 1]?.contactID ??
        msgs.find((m) => m.senderID)?.senderID ??
        chatId;

      const contact = contactId ? await storage.getContact(contactId) : undefined;
      if (!mounted) return;
      setName(contact?.name ?? contactId ?? 'Unknown');
      setUserId(contact?.userId ?? contactId);
    })();
    return () => { mounted = false; };
  }, [storage, chatId]);

  return (
    <TouchableOpacity
      onPress={() => {
        if (userId) navigation.navigate('FriendProfile', { userId });
      }}
    >
      <Text style={{ color: isDarkTheme ? '#A8A5FF' : '#594EFF', fontWeight: 'bold', fontSize: 18 }}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

export default ChatHeaderTitle;