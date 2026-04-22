public class Main {
    public static void main(String[] args) {
        String password1 = PasswordGenerator.generate(16,true,true,true,true);

        System.out.println("Generated password: " + password1);

        String password2 = PasswordGenerator.generate(16,true,true,true,true);

        System.out.println("Generated password: " + password2);
    }
}