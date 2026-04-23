import java.util.Map;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ElementCollection;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
public class Passwords {
  // The user's master username and site domain,
  // formatted as [username]#[domain].
  @Id
  private String usernameAndDomain;

  // Username -> password mappings for the master
  // user on the site domain. Passwords are encrypted
  // using AES-256.
  @ElementCollection
  private Map<String, String> passwords;
}