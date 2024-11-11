import 'package:flutter/material.dart';

class ChatListItem extends StatelessWidget {
  final String name;
  final String message;
  final String time;
  final String avatar;

  ChatListItem(
      {required this.name,
      required this.message,
      required this.time,
      required this.avatar});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8.0, bottom: 8.0),
      child: ListTile(
        leading: CircleAvatar(
          backgroundImage: NetworkImage(avatar),
        ),
        title: Text(name),
        subtitle: Text(message),
        trailing: Text(time),
      ),
    );
  }
}
