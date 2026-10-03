import { Component, type PropsWithChildren } from 'react'
import { Button, Result, Space } from 'antd'

export class ErrorBoundary extends Component<
  PropsWithChildren<{ scope?: 'app' | 'page' }>,
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      const isPage = this.props.scope === 'page'
      return (
        <div role="alert">
          <Result
            status="error"
            title={isPage ? '页面暂时无法显示' : '应用暂时无法显示'}
            subTitle="请重试；如果问题仍然存在，请刷新页面。"
            extra={
              <Space wrap>
                <Button
                  type="primary"
                  onClick={() => this.setState({ failed: false })}
                >
                  重试{isPage ? '页面' : '应用'}
                </Button>
                <Button onClick={() => window.location.reload()}>
                  刷新页面
                </Button>
              </Space>
            }
          />
        </div>
      )
    }
    return this.props.children
  }
}
