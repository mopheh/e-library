const fs = require('fs');

['.env', '.env.local'].forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (content.match(/^B2_ENDPOINT=.*$/m)) {
      content = content.replace(/^B2_ENDPOINT=.*$/m, 'B2_ENDPOINT=s3.us-east-005.backblazeb2.com');
      fs.writeFileSync(f, content);
      console.log('Updated ' + f);
    }
  }
});
