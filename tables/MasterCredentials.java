import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
public class MasterCredentials {
  // The user's master username.
  @Id
  private String username;

  // The user's master password, salted and hashed
  // with SHA-256.
  private String hashedSaltedPass;

  // The salt used on hashedSaltedPass.
  private String salt;

  // Either an email address ([^\s]+@[^\s]+.[^\s]+)
  // or a phone number to use for 2-factor
  // authentication.
  private String authContact;
}