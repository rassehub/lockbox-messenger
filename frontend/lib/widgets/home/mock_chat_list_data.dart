class Chat {
  final String name;
  final String message;
  final String time;
  final String avatar;

  Chat({
    required this.name,
    required this.message,
    required this.time,
    required this.avatar,
  });
}

List<Chat> mockChatList = [
  Chat(
    name: 'John Doe',
    message: 'Hello, how are you?',
    time: '10:00',
    avatar: 'assets/avatar.png',
  ),
  Chat(
    name: 'Jane Doe',
    message: 'I am good, thank you!',
    time: '10:01',
    avatar: 'assets/avatar.png',
  ),
  Chat(
    name: 'Meikä Masa',
    message: 'Morjesta!',
    time: '10:01',
    avatar: 'assets/avatar.png',
  ),
  Chat(
    name: 'Teikä Teppo',
    message: 'Okei!',
    time: '10:01',
    avatar: 'assets/avatar.png',
  ),
  Chat(
    name: 'Heikä Heikki',
    message: 'Näin on!',
    time: '10:01',
    avatar: 'assets/avatar.png',
  ),
];
