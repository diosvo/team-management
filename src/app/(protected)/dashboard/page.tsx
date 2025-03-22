import { LogoutButton } from '@/app/(auth)/_components/logout-button';
import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();
  // Replace with actual confirmation link if needed
  const confirmLink = '#';

  // Extract email without domain for greeting
  const userEmail = session?.user?.email || 'user@example.com';
  const emailName = userEmail.split('@')[0];

  return (
    <div>
      <h1>Dashboard</h1>
      <LogoutButton />
      <pre>{JSON.stringify(session, null, 2)}</pre>

      <div
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          maxWidth: '600px',
          margin: '40px auto',
          padding: '20px',
          color: '#24292e',
        }}
      >
        <div
          style={{
            border: '1px solid #e1e4e8',
            borderRadius: '6px',
            padding: '24px',
            backgroundColor: '#fff',
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: '16px' }}>
            <img
              src="../../../../icon.png"
              alt="Saigon Rovers Basketball Club"
              style={{
                width: '48px',
                height: '48px',
              }}
            />
          </div>

          {/* Main content */}
          <div
            style={{
              borderTop: '1px solid #e1e4e8',
              padding: '16px 0',
              marginBottom: '16px',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            <p style={{ margin: '8px 0' }}>
              Hi <strong>{emailName}</strong>,
            </p>

            <p style={{ margin: '16px 0' }}>
              Thank you for registering with Saigon Rovers Basketball Club.
              Please confirm your email address to complete your registration.
              If you did not create an account, you can ignore this email.
            </p>

            <div
              style={{
                textAlign: 'center',
                margin: '24px 0',
                padding: '16px',
                borderRadius: '6px',
                border: '1px dashed #e1e4e8',
              }}
            >
              <a
                href={confirmLink}
                style={{
                  backgroundColor: 'rgb(140, 39, 30)',
                  color: 'white',
                  padding: '10px 20px',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  fontSize: '14px',
                }}
              >
                Confirm your email
              </a>

              <p
                style={{
                  fontSize: '12px',
                  margin: '12px 0 0',
                }}
              >
                This link will only be valid for the next <u>1 hour</u>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: '1px solid #e1e4e8',
              padding: '16px 0 0',
              color: '#6a737d',
              fontSize: '12px',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0' }}>© 2024 Saigon Rovers Basketball Club.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
