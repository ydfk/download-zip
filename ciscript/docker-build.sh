ENV_KEY=$1;
BUILD_VERSION=$2;
BUILD_DIR=$3;

RELEASE_NAME=$(cat docker-build.$ENV_KEY.json | jq ".release_name" | sed 's/\"//g');
APP_NAME=$(cat docker-build.$ENV_KEY.json | jq ".app_name" | sed 's/\"//g');

IS_DEPLOY=$(cat docker-build.$ENV_KEY.json | jq ".isDeploy" | sed 's/\"//g');
DEPLOY_SSH=$(cat docker-build.$ENV_KEY.json | jq ".deploy_ssh" | sed 's/\"//g');
DEPLOY_PORT=$(cat docker-build.$ENV_KEY.json | jq ".deploy_port" | sed 's/\"//g');
DEPLOY_DIR=$(cat docker-build.$ENV_KEY.json | jq ".deploy_dir" | sed 's/\"//g');
DEPLOY_BACKUP_DIR=$(cat docker-build.$ENV_KEY.json | jq ".deploy_backup_dir" | sed 's/\"//g');

DATE=$(date +%Y%m%d%H%M%S);
echo "ENV_KEY => $ENV_KEY"
echo "BUILD_VERSION => $BUILD_VERSION"
echo "BUILD_DIR => $BUILD_DIR"
echo "RELEASE_NAME => $RELEASE_NAME"
echo "APP_NAME => $APP_NAME"
echo "IS_DEPLOY => $IS_DEPLOY"
echo "DEPLOY_SSH => $DEPLOY_SSH"
echo "DEPLOY_PORT => $DEPLOY_PORT"
echo "DEPLOY_DIR => $DEPLOY_DIR"
echo "DEPLOY_BACKUP_DIR => $DEPLOY_BACKUP_DIR"

echo "build nodejs"
echo "pnpm -v";
pnpm -v;
echo "pnpm install";
pnpm install;
echo "pnpm lint";
pnpm lint;
echo "pnpm build";
pnpm build;
echo "pnpm prune --prod";
pnpm prune --prod;

echo "build docker"
echo "docker images|grep $RELEASE_NAME|awk '{print $3}'|xargs docker rmi";
docker images|grep $RELEASE_NAME|awk '{print $3}'|xargs docker rmi
echo "docker build -t '$RELEASE_NAME:$BUILD_VERSION' .";
docker build -t $RELEASE_NAME:$BUILD_VERSION .
echo "docker tag '$RELEASE_NAME:$BUILD_VERSION' '$RELEASE_NAME:latest'";
docker tag $RELEASE_NAME:$BUILD_VERSION $RELEASE_NAME:latest

echo "save docker"
echo "docker save -o '$RELEASE_NAME-$BUILD_VERSION-docker.tar' '$RELEASE_NAME:latest'";
docker save -o $RELEASE_NAME-$BUILD_VERSION-docker.tar $RELEASE_NAME:latest

echo "replace docker-compose.yml"
echo "sed -i 's/container_name-$RELEASE_NAME/$APP_NAME/g' docker-compose.yml";
sed -i "s/container_name-$RELEASE_NAME/$APP_NAME/g" docker-compose.yml

echo "build docker zip"
echo "zip -r '$RELEASE_NAME-$BUILD_VERSION-docker.zip' .env.example '$RELEASE_NAME-$BUILD_VERSION-docker.tar' docker-compose.yml";
zip -r $RELEASE_NAME-$BUILD_VERSION-docker.zip .env.example $RELEASE_NAME-$BUILD_VERSION-docker.tar docker-compose.yml

# echo "build zip"
# echo "zip -r '$RELEASE_NAME-$BUILD_VERSION.zip' .env.example package.json build node_modules";
# zip -r $RELEASE_NAME-$BUILD_VERSION.zip .env.example package.json build node_modules

IF [ $IS_DEPLOY = false ]; THEN
    echo "不部署";
    exit 0;
fi

echo '清空备份目录(只保留上一个备份)';
echo "ssh -p $DEPLOY_PORT $DEPLOY_SSH 'rm -rf $DEPLOY_BACKUP_DIR'";
ssh -p $DEPLOY_PORT $DEPLOY_SSH "rm -rf '$DEPLOY_BACKUP_DIR'";
echo "ssh -p $DEPLOY_PORT $DEPLOY_SSH 'mkdir -p $DEPLOY_BACKUP_DIR'";
ssh -p $DEPLOY_PORT $DEPLOY_SSH "mkdir -p '$DEPLOY_BACKUP_DIR'";

echo '备份';
echo "ssh -p $DEPLOY_PORT $DEPLOY_SSH \"mkdir -p '$DEPLOY_BACKUP_DIR/$DATE'\"";
ssh -p $DEPLOY_PORT $DEPLOY_SSH "mkdir -p '$DEPLOY_BACKUP_DIR/$DATE'";
echo "ssh -p $DEPLOY_PORT $DEPLOY_SSH \"cp -R '$DEPLOY_DIR' '$DEPLOY_BACKUP_DIR/$DATE'\"";
ssh -p $DEPLOY_PORT $DEPLOY_SSH "cp -R '$DEPLOY_DIR' '$DEPLOY_BACKUP_DIR/$DATE'";

echo '停止服务';
echo "ssh -p $DEPLOY_PORT $DEPLOY_SSH 'docker-compose -f $DEPLOY_DIR/docker-compose.yml down'";
ssh -p $DEPLOY_PORT $DEPLOY_SSH "docker-compose -f '$DEPLOY_DIR/docker-compose.yml' down";

echo '清空部署目录内旧文件';
echo "ssh -p $DEPLOY_PORT $DEPLOY_SSH 'rm -rf $DEPLOY_DIR/*.zip'";
ssh -p $DEPLOY_PORT $DEPLOY_SSH "rm -rf '$DEPLOY_DIR/*.zip'";
echo "ssh -p $DEPLOY_PORT $DEPLOY_SSH 'rm -rf $DEPLOY_DIR/*.tar'";
ssh -p $DEPLOY_PORT $DEPLOY_SSH "rm -rf '$DEPLOY_DIR/*.tar'";

echo '拷贝文件到服务器';
echo "scp -P $DEPLOY_PORT -r '$BUILD_DIR/$RELEASE_NAME-$BUILD_VERSION-docker.zip' $DEPLOY_SSH:$DEPLOY_DIR";
scp -P $DEPLOY_PORT -r "$BUILD_DIR/$RELEASE_NAME-$BUILD_VERSION-docker.zip" $DEPLOY_SSH:$DEPLOY_DIR

echo '解压缩';
echo "ssh -p $DEPLOY_PORT $DEPLOY_SSH 'unzip -o $DEPLOY_DIR/$RELEASE_NAME-$BUILD_VERSION-docker.zip -d $DEPLOY_DIR'";
ssh -p $DEPLOY_PORT $DEPLOY_SSH "unzip -o '$DEPLOY_DIR/$RELEASE_NAME-$BUILD_VERSION-docker.zip' -d '$DEPLOY_DIR'";

echo '启动服务';
echo "ssh -p $DEPLOY_PORT $DEPLOY_SSH 'docker load -i $DEPLOY_DIR/$RELEASE_NAME-$BUILD_VERSION-docker.tar'";
ssh -p $DEPLOY_PORT $DEPLOY_SSH "docker load -i '$DEPLOY_DIR/$RELEASE_NAME-$BUILD_VERSION-docker.tar'";
echo "ssh -p $DEPLOY_PORT $DEPLOY_SSH 'docker-compose -f $DEPLOY_DIR/docker-compose.yml up -d'";
ssh -p $DEPLOY_PORT $DEPLOY_SSH "docker-compose -f '$DEPLOY_DIR/docker-compose.yml' up -d";

