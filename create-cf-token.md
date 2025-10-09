# 手动创建 Cloudflare API Token

如果 GenSpark Deploy Tab 不可用，按照以下步骤手动创建：

## 步骤：

1. **访问**: https://dash.cloudflare.com/profile/api-tokens

2. **点击**: "Create Token"

3. **选择模板**: "Edit Cloudflare Workers"

4. **或自定义权限**:
   ```
   Permissions:
   - Account > Cloudflare Pages > Edit
   - Account > D1 > Edit
   
   Account Resources:
   - Include > All accounts
   ```

5. **创建并复制 Token**

6. **在终端设置**:
   ```bash
   export CLOUDFLARE_API_TOKEN="your-token-here"
   ```

7. **验证**:
   ```bash
   npx wrangler whoami
   ```
