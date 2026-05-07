library corbit_mono;

import 'package:flutter/widgets.dart';

class CorbitMono {
  CorbitMono._();

  /// The font family name for Corbit Mono.
  /// 
  /// Use it in [TextStyle]:
  /// ```dart
  /// Text('Hello World', style: TextStyle(fontFamily: CorbitMono.family))
  /// ```
  static const String family = 'CorbitMono';

  /// The package name if you are using it from another package.
  static const String package = 'corbit_mono';

  /// A helper method to get the [TextStyle] with Corbit Mono.
  static TextStyle textStyle({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    double? letterSpacing,
  }) {
    return TextStyle(
      fontFamily: family,
      package: package,
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      letterSpacing: letterSpacing,
    );
  }
}
