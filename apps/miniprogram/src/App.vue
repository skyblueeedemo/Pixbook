<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { useAuth } from '@/composables/useAuth';

const { silentLogin } = useAuth();

onLaunch(() => {
  console.log('🚀 Pixbook 小程序启动');
  // Silent login on cold start
  silentLogin();
});
</script>

<style>
/* Global styles */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  font-size: 14px;
  color: #333;
}
</style>
