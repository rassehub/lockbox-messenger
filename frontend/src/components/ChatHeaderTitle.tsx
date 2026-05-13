import { useNavigation } from "@react-navigation/native";
import { useChat } from "../ChatContext";
import { useTheme } from "../ThemeContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity } from "react-native";

const ChatHeaderTitle: React.FC<{ userId: string, chatId: string }> = ({ userId, chatId }) => {
  const { isDarkTheme } = useTheme();
  const { storage } = useChat();
  const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();
  const [name, setName] = useState<string>('Unknown');

  useEffect(() => {
    (async () => {
      console.log('header:', userId)
      if (!storage) return;
      
      const getContact = async () => {
        const contact = await storage.getContact(userId);
        setName(contact?.name ?? '');
      }

      getContact();
    })();
  }, [storage, userId]);

  return (
    <TouchableOpacity
      onPress={() => {
        if (userId) navigation.navigate('FriendProfile', { userId, chatId });
      }}
    >
      <Text style={{ color: isDarkTheme ? '#A8A5FF' : '#594EFF', fontWeight: 'bold', fontSize: 18 }}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

export default ChatHeaderTitle;