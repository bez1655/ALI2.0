# Caddy — вторая игра на том же VPS

HCG уже слушает `127.0.0.1:3001`.
Эта игра слушает **`127.0.0.1:3002`**.

Не занимайте 3001. Не проксируйте обе игры на один порт.

## DNS

В панели домена добавьте A-запись:

```
ali.bez12.store    A    IP-ВАШЕГО-СЕРВЕРА
```

(или другой поддомен, тогда поправьте `WEB_APP_URL` в `.env`)

## Блок в Caddyfile

Обычно файл: `/etc/caddy/Caddyfile`

Добавьте **новый** сайт, старый блок HCG не трогайте:

```
ali.bez12.store {
    encode gzip
    reverse_proxy 127.0.0.1:3002
}
```

Проверка и перезагрузка:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Сертификат Let's Encrypt Caddy возьмёт сам, если порт 80/443 открыты.

## Telegram Mini App

@BotFather → ваш **новый** бот → Bot Settings → Menu Button / Configure Mini App

URL: `https://ali.bez12.store`
