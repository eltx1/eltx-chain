# Apache VirtualHost Examples for ELTX Chain

Deploy these behind Cloudflare using "Full" SSL mode with proxy (orange cloud) enabled. Replace `/var/www` paths with your deployment layout.

## rpc.eltx.online
```apache
<VirtualHost *:443>
    ServerName rpc.eltx.online
    DocumentRoot /var/www/html

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/rpc.eltx.online/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/rpc.eltx.online/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:18545/
    ProxyPassReverse / http://127.0.0.1:18545/

    <Location />
        Require all granted
        ProxyPassReverseCookieDomain 127.0.0.1 rpc.eltx.online
    </Location>

    Include /etc/apache2/eltx/eltx-rpc-htaccess.conf
</VirtualHost>
```

## explorer.eltx.online
```apache
<VirtualHost *:443>
    ServerName explorer.eltx.online
    DocumentRoot /var/www/blockscout

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/explorer.eltx.online/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/explorer.eltx.online/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:14000/
    ProxyPassReverse / http://127.0.0.1:14000/

    Include /etc/apache2/eltx/eltx-explorer-htaccess.conf
</VirtualHost>
```

## faucet.eltx.online
```apache
<VirtualHost *:443>
    ServerName faucet.eltx.online

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/faucet.eltx.online/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/faucet.eltx.online/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:18080/
    ProxyPassReverse / http://127.0.0.1:18080/

    Include /etc/apache2/eltx/eltx-faucet-htaccess.conf
</VirtualHost>
```
