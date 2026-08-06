export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">帮助中心</h1>
      
      <div className="space-y-8">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">基本使用</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              浏览照片：在首页浏览所有照片，使用筛选功能快速找到您需要的内容
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              查看详情：点击照片卡片进入详情页面，查看完整信息
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              查看原图：在详情页面点击图片可查看原图
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">用户账号</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              注册账号：点击右上角"注册"按钮，填写用户名、邮箱和密码
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              登录：使用注册的用户名和密码登录
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              会员权益：会员用户可无限次查看联系方式和链接信息
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">查看限制</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              未登录用户：无法查看联系方式和链接信息
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              普通会员：每日可查看5次联系方式和链接信息
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              VIP会员：无限次查看联系方式和链接信息
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">筛选功能</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              价格区间：可选择0-500、500-1000、1000以上等价格范围
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              关键字搜索：支持按名称、标签、城市进行模糊搜索
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              城市筛选：输入城市名称筛选特定地区的照片
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">常见问题</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">如何成为会员？</h3>
              <p className="text-gray-600">请联系管理员开通会员权限。管理员会在后台为您设置会员有效期。</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">忘记密码怎么办？</h3>
              <p className="text-gray-600">请联系管理员重置密码。</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">照片可以下载吗？</h3>
              <p className="text-gray-600">请尊重版权，照片仅供预览查看。如需使用请联系照片提供者。</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
