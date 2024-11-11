import 'package:flutter/material.dart';
import 'lockbox.dart';
import 'package:frontend/screens/home/home_screen.dart';
import 'package:frontend/screens/profile/profile_screen.dart';
import 'package:frontend/widgets/common/nav_bar.dart';

void main() {
  runApp(MaterialApp(
    title: 'Lockbox',
    initialRoute: '/main',
    routes: {
      '/main': (context) => MainLayout(),
      '/home': (context) => HomeScreen(),
      '/profile': (context) => ProfileScreen(),
    },
  ));
}
