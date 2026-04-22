import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class PasswordGenerator {

  private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
  private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  private static final String DIGITS = "0123456789";
  private static final String SYMBOLS = "!@#$%^&*()-_=+[]{}<>?";

  private static final SecureRandom random = new SecureRandom();

  public static String generate(int length, boolean useLower, boolean useUpper,
      boolean useDigits, boolean useSymbols) {
    List<String> selectedSets = new ArrayList<>();
    if (useLower)
      selectedSets.add(LOWER);
    if (useUpper)
      selectedSets.add(UPPER);
    if (useDigits)
      selectedSets.add(DIGITS);
    if (useSymbols)
      selectedSets.add(SYMBOLS);

    // Enforce that they use a mix of the input types
    List<Character> passwordChars = new ArrayList<>();
    for (String set : selectedSets) {
      passwordChars.add(getRandomChar(set));
    }

    StringBuilder allChars = new StringBuilder();
    for (String set : selectedSets) {
      allChars.append(set);
    }

    while (passwordChars.size() < length) {
      passwordChars.add(getRandomChar(allChars.toString()));
    }

    Collections.shuffle(passwordChars, random);
    StringBuilder result = new StringBuilder();
    for (char c : passwordChars) {
      result.append(c);
    }

    return result.toString();
  }

  private static char getRandomChar(String charset) {
    int index = random.nextInt(charset.length());
    return charset.charAt(index);
  }
}