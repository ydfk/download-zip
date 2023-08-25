ENV_KEY=$1;
BUILD_VERSION=$2;
BUILD_DIR=$3;
SSH=$(cat deploy.$ENV_KEY.json | jq ".ssh" | sed 's/\"//g');
PORT=$(cat deploy.$ENV_KEY.json | jq ".port" | sed 's/\"//g');
DEPLOY_DIR=$(cat deploy.$ENV_KEY.json | jq ".deploy_dir" | sed 's/\"//g');
BACKUP_DIR=$(cat deploy.$ENV_KEY.json | jq ".backup_dir" | sed 's/\"//g');
RELEASE_NAME=$(cat deploy.$ENV_KEY.json | jq ".release_name" | sed 's/\"//g');
APP_NAME=$(cat deploy.$ENV_KEY.json | jq ".app_name" | sed 's/\"//g');
DATE=$(date +%Y%m%d%H%M%S);
echo "SSH => $SSH"
echo "PORT => $PORT"
echo "DEPLOY_DIR => $DEPLOY_DIR"
echo "BACKUP_DIR => $BACKUP_DIR"
echo "RELEASE_NAME => $RELEASE_NAME"
echo "APP_NAME => $APP_NAME"

echo '清空备份目录(只保留上一个备份)';
echo "ssh -p $PORT $SSH 'rm -rf $BACKUP_DIR'";
ssh -p $PORT $SSH "rm -rf '$BACKUP_DIR'";
echo "ssh -p $PORT $SSH 'mkdir -p $BACKUP_DIR'";
ssh -p $PORT $SSH "mkdir -p '$BACKUP_DIR'";

echo '备份';
echo "ssh -p $PORT $SSH \"mkdir -p '$BACKUP_DIR/$DATE'\"";
ssh -p $PORT $SSH "mkdir -p '$BACKUP_DIR/$DATE'";
echo "ssh -p $PORT $SSH \"cp -R '$DEPLOY_DIR' '$BACKUP_DIR/$DATE'\"";
ssh -p $PORT $SSH "cp -R '$DEPLOY_DIR' '$BACKUP_DIR/$DATE'";

echo '停止服务';
echo "ssh -p $PORT $SSH 'pm2 stop $APP_NAME'";
ssh -p $PORT $SSH "pm2 stop $APP_NAME";

echo '清空部署目录内旧文件';
#echo "ssh -p $PORT $SSH 'rm -rf $DEPLOY_DIR'";
#ssh -p $PORT $SSH "rm -rf '$DEPLOY_DIR'";
#echo "ssh -p $PORT $SSH 'mkdir -p $DEPLOY_DIR'";
#ssh -p $PORT $SSH "mkdir -p '$DEPLOY_DIR'";
echo "ssh -p $PORT $SSH 'rm -rf $DEPLOY_DIR/$RELEASE_NAME.zip'";
ssh -p $PORT $SSH "rm -rf '$DEPLOY_DIR/$RELEASE_NAME.zip'";
ssh -p $PORT $SSH "rm -rf '$DEPLOY_DIR/build'";
ssh -p $PORT $SSH "rm -rf '$DEPLOY_DIR/package.json";

echo '拷贝文件到服务器';
echo "scp -P $PORT -r '$BUILD_DIR/$RELEASE_NAME.zip' $SSH:$DEPLOY_DIR";
scp -P $PORT -r "$BUILD_DIR/$RELEASE_NAME.zip" $SSH:$DEPLOY_DIR

echo '解压缩';
echo "ssh -p $PORT $SSH 'unzip -o $DEPLOY_DIR/$RELEASE_NAME.zip -d $DEPLOY_DIR'";
ssh -p $PORT $SSH "unzip -o '$DEPLOY_DIR/$RELEASE_NAME.zip' -d '$DEPLOY_DIR'";

echo '运行install';
echo "ssh $SSH 'pnpm install'";
ssh $SSH "pnpm install";

echo '进入根目录启动服务';
echo "ssh -p $PORT $SSH 'pm2 restart $APP_NAME'";
ssh -p $PORT $SSH "pm2 restart $APP_NAME";