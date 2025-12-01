import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

public class PrintBcrypt {
    public static void main(String[] args) {
        PasswordEncoder encoder = new BCryptPasswordEncoder();

        String adminPlain = "admin_password_here";
        String readerPlain = "reader_password_here";

        String adminHash = encoder.encode(adminPlain);
        String readerHash = encoder.encode(readerPlain);

        System.out.println("ADMIN PLAIN: " + adminPlain);
        System.out.println("ADMIN HASH : " + adminHash);
        System.out.println("READER PLAIN: " + readerPlain);
        System.out.println("READER HASH : " + readerHash);
    }
}