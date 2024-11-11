import 'package:flutter/material.dart';
import 'package:frontend/widgets/home/chat_list_item.dart';
import 'package:frontend/widgets/home/mock_chat_list_data.dart';

class ChatList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Container(
        width: 450,
        child: Scaffold(
          body: ListView.builder(
            itemCount: mockChatList.length,
            itemBuilder: (context, index) {
              final chat = mockChatList[index];
              return ChatListItem(
                name: chat.name,
                message: chat.message,
                time: chat.time,
                avatar: chat.avatar,
              );
            },
          ),
        ),
      ),
    );
  }
}
