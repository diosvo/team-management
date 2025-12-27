// 👀 Keep the same order to avoid dependency issues

// 1. Global configurations and mocks
import './setup/global';

// 2. Next.js specific configurations
import './setup/next';

// 3. Chakra UI specific configurations
// 🔗 Refer to: https://chakra-ui.com/docs/components/concepts/testing#setup-test-file
import './setup/chakra-ui';

// 4. Third-party libraries configurations
import './setup/third-parties';
