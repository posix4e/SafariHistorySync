import UIKit
import SafariServices

class ViewController: UIViewController {
    
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "Safari History Sync"
        label.font = UIFont.systemFont(ofSize: 24, weight: .bold)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private let descriptionLabel: UILabel = {
        let label = UILabel()
        label.text = "This app allows you to track and synchronize your Safari browsing history across devices using decentralized technology."
        label.font = UIFont.systemFont(ofSize: 16)
        label.textAlignment = .center
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private let enableExtensionButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Enable Safari Extension", for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
        button.backgroundColor = .systemBlue
        button.setTitleColor(.white, for: .normal)
        button.layer.cornerRadius = 10
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()
    
    private let statusLabel: UILabel = {
        let label = UILabel()
        label.text = "Extension Status: Not Enabled"
        label.font = UIFont.systemFont(ofSize: 14)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        view.addSubview(titleLabel)
        view.addSubview(descriptionLabel)
        view.addSubview(enableExtensionButton)
        view.addSubview(statusLabel)
        
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 40),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            titleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            descriptionLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 20),
            descriptionLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            descriptionLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            enableExtensionButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            enableExtensionButton.topAnchor.constraint(equalTo: descriptionLabel.bottomAnchor, constant: 40),
            enableExtensionButton.widthAnchor.constraint(equalToConstant: 250),
            enableExtensionButton.heightAnchor.constraint(equalToConstant: 50),
            
            statusLabel.topAnchor.constraint(equalTo: enableExtensionButton.bottomAnchor, constant: 20),
            statusLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            statusLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
        
        enableExtensionButton.addTarget(self, action: #selector(enableExtensionTapped), for: .touchUpInside)
    }
    
    @objc private func enableExtensionTapped() {
        // In a real app, this would open Safari extension settings
        let safariViewController = SFSafariViewController(url: URL(string: "https://support.apple.com/guide/iphone/use-extensions-iphf7c5b8c95/ios")!)
        present(safariViewController, animated: true, completion: nil)
    }
}