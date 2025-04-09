import UserForm from '@/components/UserForm';
import { Box } from '@chakra-ui/react';

export default function SettingsPage() {
  return (
    <>
      <Box mb={8}>
        <UserForm />
      </Box>
    </>
  );
}
