import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import * as _ from 'lodash';
const YAML_COMMON_CONFIG_FILENAME = 'config.yaml';
const filePath = join(
  __dirname,
  '../../nest-config-start/config/',
  YAML_COMMON_CONFIG_FILENAME,
);
const envPath = join(
  __dirname,
  '../../nest-config-start/config/',
  `config.${process.env.NODE_ENV || 'development'}.yaml`,
);
/* const prodPath = join(
  __dirname,
  '../../nest-config-start/config/',
  `config.${process.env.NODE_ENV || 'production'}.yaml`,
); */
const commonConfig = yaml.load(readFileSync(filePath, 'utf8'));
const envConfig = yaml.load(readFileSync(envPath, 'utf8'));
// const prodConfig = yaml.load(readFileSync(prodPath, 'utf8'));

// 这里采用了函数的形式到处，是因为ConfigModule有一个load方法，它会导出一个函数
export default () => {
  // 利用lodash方法合并文件
  return _.merge(commonConfig, envConfig);
};
